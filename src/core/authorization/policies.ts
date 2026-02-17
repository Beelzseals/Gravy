export type ORG_ROLE = "ORG_OWNER" | "ORG_ADMIN" | "ORG_MEMBER" | "ORG_VIEWER";
export type PROJECT_ROLE =
  | "PROJECT_OWNER"
  | "PROJECT_EDITOR"
  | "PROJECT_VIEWER";

export const ORG_ROLE_HIERARCHY: Record<ORG_ROLE, number> = {
  ORG_OWNER: 4,
  ORG_ADMIN: 3,
  ORG_MEMBER: 2,
  ORG_VIEWER: 1,
};

export const hasRequiredRole = (
  userRole: ORG_ROLE,
  requiredRole: ORG_ROLE,
): boolean => {
  return ORG_ROLE_HIERARCHY[userRole] >= ORG_ROLE_HIERARCHY[requiredRole];
};
