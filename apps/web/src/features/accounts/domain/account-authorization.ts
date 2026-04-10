import { type OrganizationAccountRecord } from "@/features/accounts/domain/organization-account";

export function canInviteTeamMembers(actor: OrganizationAccountRecord) {
  return actor.role === "admin" && actor.status === "active";
}

export function canManageAccountAuthorization(
  actor: OrganizationAccountRecord,
  target: OrganizationAccountRecord,
) {
  return (
    actor.role === "admin" &&
    actor.status === "active" &&
    actor.userId !== target.userId
  );
}

export function canEditAccountIdentity(
  actor: OrganizationAccountRecord,
  target: OrganizationAccountRecord,
) {
  return (
    actor.status === "active" &&
    (actor.role === "admin" || actor.userId === target.userId)
  );
}

export function canResetAccountPassword(
  actor: OrganizationAccountRecord,
  target: OrganizationAccountRecord,
) {
  return canEditAccountIdentity(actor, target);
}

export function canOpenAccountControls(
  actor: OrganizationAccountRecord,
  target: OrganizationAccountRecord,
) {
  return (
    canManageAccountAuthorization(actor, target) ||
    canEditAccountIdentity(actor, target) ||
    canResetAccountPassword(actor, target)
  );
}
