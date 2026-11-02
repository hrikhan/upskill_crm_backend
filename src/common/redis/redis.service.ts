import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis | null = null;
  private readonly logger = new Logger(RedisService.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (!redisUrl) {
      this.logger.warn('REDIS_URL not configured. Redis cache will run in dummy mode.');
      return;
    }

    try {
      this.client = new Redis(redisUrl, {
        tls: redisUrl.startsWith('rediss://') ? {} : undefined,
        maxRetriesPerRequest: 2,
        retryStrategy: (times) => {
          if (times > 3) return null;
          return Math.min(times * 100, 2000);
        },
      });

      this.client.on('connect', () => this.logger.log('Connected to Upstash Redis'));
      this.client.on('error', (err) => this.logger.warn('Redis warning: ' + err.message));
    } catch (err: any) {
      this.logger.warn('Failed to initialize Redis: ' + err.message);
    }
  }

  getClient(): Redis | null {
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) return null;
    try {
      return await this.client.get(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds = 300): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } catch {}
  }

  async del(pattern: string): Promise<void> {
    if (!this.client) return;
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch {}
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }
}
