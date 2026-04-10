import { z } from "zod";

export const actorRoleSchema = z.enum([
  "owner",
  "admin",
  "operator",
  "analyst",
  "viewer",
]);

export const permissionSchema = z.enum(["read", "write", "approve", "admin"]);

export type ActorRole = z.infer<typeof actorRoleSchema>;
export type Permission = z.infer<typeof permissionSchema>;

const permissionsByRole: Record<ActorRole, Permission[]> = {
  owner: ["read", "write", "approve", "admin"],
  admin: ["read", "write", "approve", "admin"],
  operator: ["read", "write", "approve"],
  analyst: ["read", "write"],
  viewer: ["read"],
};

export function canAccessOrgResource(input: {
  actorOrgId: string;
  actorRole: ActorRole;
  permission: Permission;
  resourceOrgId: string;
}): boolean {
  if (input.actorOrgId !== input.resourceOrgId) {
    return false;
  }

  return permissionsByRole[input.actorRole].includes(input.permission);
}
