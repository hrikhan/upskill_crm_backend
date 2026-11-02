import { SetMetadata } from '@nestjs/common';
import { ModulePermissionKey } from '@prisma/client';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete';

export interface RequiredPermission {
  module: ModulePermissionKey;
  action: PermissionAction;
}

export const PERMISSION_CHECK_KEY = 'require_permission';
export const RequirePermissions = (permission: RequiredPermission) =>
  SetMetadata(PERMISSION_CHECK_KEY, permission);
