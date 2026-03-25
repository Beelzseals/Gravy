import { OrgRole } from "../../core/authorization/roles";
import { OrgAction } from "../../core/authorization/actions";
import { CustomError } from "../../core/error/error.factory";

export interface OrgPolicyContext {
  actorUserId: string;
  orgId?: string;
  orgRole?: OrgRole | null;
}

export class OrganizationPolicy {
  can(action: OrgAction, ctx: OrgPolicyContext): boolean {
    if (!ctx.actorUserId) return false;
    if (!ctx.orgId) return false;
    if (!ctx.orgRole) return false;

    switch (action) {
      case "view":
        return this.canView(ctx);

      case "updateSettings":
        return this.canUpdateSettings(ctx);

      case "manageMembers":
        return this.canManageMembers(ctx);

      case "createProject":
        return this.canCreateProject(ctx);

      case "viewBilling":
        return this.canViewBilling(ctx);

      default:
        return false;
    }
  }

  private canView(ctx: OrgPolicyContext): boolean {
    return (
      ctx.orgRole === "ORG_OWNER" ||
      ctx.orgRole === "ORG_ADMIN" ||
      ctx.orgRole === "ORG_MEMBER"
    );
  }

  private canUpdateSettings(ctx: OrgPolicyContext): boolean {
    return ctx.orgRole === "ORG_OWNER" || ctx.orgRole === "ORG_ADMIN";
  }

  private canManageMembers(ctx: OrgPolicyContext): boolean {
    return ctx.orgRole === "ORG_OWNER" || ctx.orgRole === "ORG_ADMIN";
  }

  private canCreateProject(ctx: OrgPolicyContext): boolean {
    return ctx.orgRole === "ORG_OWNER" || ctx.orgRole === "ORG_ADMIN";
  }

  private canViewBilling(ctx: OrgPolicyContext): boolean {
    return ctx.orgRole === "ORG_OWNER" || ctx.orgRole === "ORG_ADMIN";
  }

  assert(action: OrgAction, ctx: OrgPolicyContext) {
    const isAllowed = this.can(action, ctx);
    if (!isAllowed) {
      throw CustomError.unauthorized("Unauthorized");
    }
  }
}
