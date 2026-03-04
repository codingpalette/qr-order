import type { Permission } from "../model/types";

/**
 * Resolve final permissions by merging role defaults with user overrides.
 * Overrides can grant (add) or revoke (remove) individual permissions.
 */
export function resolvePermissions(
  rolePermissions: string[],
  userOverrides: { permission: string; granted: boolean }[],
): Set<string> {
  const permissions = new Set(rolePermissions);

  for (const override of userOverrides) {
    if (override.granted) {
      permissions.add(override.permission);
    } else {
      permissions.delete(override.permission);
    }
  }

  return permissions;
}

/**
 * Check if a permission set contains the required permission.
 */
export function hasPermission(
  permissions: Set<string>,
  required: Permission,
): boolean {
  return permissions.has(required);
}
