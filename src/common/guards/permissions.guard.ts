import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ModulePermissionKey, UserRole } from '@prisma/client';
import { PERMISSION_CHECK_KEY, RequiredPermission } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<RequiredPermission>(
      PERMISSION_CHECK_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('User context not found.');
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    if (user.role === UserRole.ADMIN) {
      if (required.module === ModulePermissionKey.ADMINS) {
        throw new ForbiddenException('Exclusive Super Admin authority required.');
      }
      return true;
    }

    if (user.role === UserRole.STAFF) {
      const userPermissions = user.permissions || [];
      const perm = userPermissions.find((p: any) => p.module === required.module);

      if (!perm) {
        throw new ForbiddenException(`Access denied to module: ${required.module}`);
      }

      let allowed = false;
      switch (required.action) {
        case 'view':
          allowed = perm.canView;
          break;
        case 'create':
          allowed = perm.canCreate;
          break;
        case 'edit':
          allowed = perm.canEdit;
          break;
        case 'delete':
          allowed = perm.canDelete;
          break;
      }

      if (!allowed) {
        throw new ForbiddenException(`Action '${required.action}' not permitted on module: ${required.module}`);
      }
      return true;
    }

    return false;
  }
}
