export type ORG_ROLE = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

export const ORG_ROLE_HIERARCHY: Record<ORG_ROLE, number> = {
  OWNER: 4,
  ADMIN: 3,
  MEMBER: 2,
  VIEWER: 1,
};

export const hasRequiredRole = (
  userRole: ORG_ROLE,
  requiredRole: ORG_ROLE,
): boolean => {
  return ORG_ROLE_HIERARCHY[userRole] >= ORG_ROLE_HIERARCHY[requiredRole];
};
