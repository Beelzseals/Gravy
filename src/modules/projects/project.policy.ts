import { ProjectAction } from "../../core/authorization/actions";
import { OrgRole, ProjectRole } from "../../core/authorization/roles";

export interface ProjectPolicyContext {
  actorUserId: string;
  orgId?: string;
  projectId?: string;
  orgRole?: OrgRole | null;
  projectRole?: ProjectRole | null;
}

export class ProjectPolicy {
  can(action: ProjectAction, ctx: ProjectPolicyContext): boolean {
    if (!ctx.actorUserId) return false;

    switch (action) {
      case "create":
        return this.canCreate(ctx);

      case "view":
        return this.canView(ctx);

      case "update":
        return this.canUpdate(ctx);

      case "delete":
        return this.canDelete(ctx);

      case "inviteMember":
        return this.canInviteMember(ctx);

      case "changeMemberRole":
        return this.canChangeMemberRole(ctx);

      case "removeMember":
        return this.canRemoveMember(ctx);

      default:
        return false;
    }
  }
  private canCreate(ctx: ProjectPolicyContext): boolean {
    if (!ctx.orgId) return false;
    if (!ctx.orgRole) return false;

    return ctx.orgRole === "ORG_OWNER" || ctx.orgRole === "ORG_ADMIN";
  }

  private canView(ctx: ProjectPolicyContext): boolean {
    if (!ctx.orgId || !ctx.projectId) return false;
    if (!ctx.orgRole) return false;
    if (!ctx.projectRole) return false;

    return (
      ctx.orgRole === "ORG_OWNER" ||
      ctx.orgRole === "ORG_ADMIN" ||
      ctx.projectRole === "PROJECT_OWNER" ||
      ctx.projectRole === "PROJECT_EDITOR" ||
      ctx.projectRole === "PROJECT_VIEWER"
    );
  }

  private canUpdate(ctx: ProjectPolicyContext): boolean {
    if (!ctx.orgId || !ctx.projectId) return false;
    if (!ctx.orgRole) return false;
    if (!ctx.projectRole) return false;

    return (
      ctx.orgRole === "ORG_OWNER" ||
      ctx.orgRole === "ORG_ADMIN" ||
      ctx.projectRole === "PROJECT_OWNER" ||
      ctx.projectRole === "PROJECT_EDITOR"
    );
  }

  private canDelete(ctx: ProjectPolicyContext): boolean {
    if (!ctx.orgId || !ctx.projectId) return false;
    if (!ctx.orgRole || !ctx.projectRole) return false;

    return (
      ctx.orgRole === "ORG_OWNER" ||
      ctx.orgRole === "ORG_ADMIN" ||
      ctx.projectRole === "PROJECT_OWNER"
    );
  }

  private canInviteMember(ctx: ProjectPolicyContext): boolean {
    if (!ctx.orgId || !ctx.projectId) return false;
    if (!ctx.orgRole || !ctx.projectRole) return false;

    return (
      ctx.orgRole === "ORG_OWNER" ||
      ctx.orgRole === "ORG_ADMIN" ||
      ctx.projectRole === "PROJECT_OWNER"
    );
  }

  private canChangeMemberRole(ctx: ProjectPolicyContext): boolean {
    if (!ctx.orgId || !ctx.projectId) return false;
    if (!ctx.orgRole || !ctx.projectRole) return false;

    return (
      ctx.orgRole === "ORG_OWNER" ||
      ctx.orgRole === "ORG_ADMIN" ||
      ctx.projectRole === "PROJECT_OWNER"
    );
  }

  private canRemoveMember(ctx: ProjectPolicyContext): boolean {
    if (!ctx.orgId || !ctx.projectId) return false;
    if (!ctx.orgRole || !ctx.projectRole) return false;

    return (
      ctx.orgRole === "ORG_OWNER" ||
      ctx.orgRole === "ORG_ADMIN" ||
      ctx.projectRole === "PROJECT_OWNER"
    );
  }

  assert(action: ProjectAction, ctx: ProjectPolicyContext) {
    const allowed = this.can(action, ctx);
    if (!allowed) {
      throw new Error("Not allowed to perform this action");
    }
  }
}
