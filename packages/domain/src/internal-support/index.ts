import { z } from "zod";

export const internalSupportRoleValues = ["none", "support", "admin"] as const;

export const internalSupportRoleSchema = z.enum(internalSupportRoleValues);
export type InternalSupportRole = z.infer<typeof internalSupportRoleSchema>;

export interface InternalSupportIdentity {
  internalRole?: InternalSupportRole | null;
}

export function getInternalSupportRole(
  user: InternalSupportIdentity | null | undefined
): InternalSupportRole {
  const parsedRole = internalSupportRoleSchema.safeParse(user?.internalRole);

  return parsedRole.success ? parsedRole.data : "none";
}

export function isInternalSupportUser(
  user: InternalSupportIdentity | null | undefined
): boolean {
  return getInternalSupportRole(user) !== "none";
}

export function canAccessSupportTools(
  user: InternalSupportIdentity | null | undefined
): boolean {
  const role = getInternalSupportRole(user);

  return role === "support" || role === "admin";
}

export function canPerformSupportLookup(
  user: InternalSupportIdentity | null | undefined
): boolean {
  return canAccessSupportTools(user);
}
