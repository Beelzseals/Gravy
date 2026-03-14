export type OrgRole = "ORG_OWNER" | "ORG_ADMIN" | "ORG_MEMBER" | "ORG_VIEWER";
export type ProjectRole = "PROJECT_OWNER" | "PROJECT_EDITOR" | "PROJECT_VIEWER";

export const ORG_ROLE_HIERARCHY: Record<OrgRole, number> = {
  ORG_OWNER: 4,
  ORG_ADMIN: 3,
  ORG_MEMBER: 2,
  ORG_VIEWER: 1,
};

export const hasRequiredRole = (
  userRole: OrgRole,
  requiredRole: OrgRole,
): boolean => {
  return ORG_ROLE_HIERARCHY[userRole] >= ORG_ROLE_HIERARCHY[requiredRole];
};
