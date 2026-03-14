import { ProjectAction } from "../../core/authorization/actions";
import { OrgMembershipRepository } from "../organizations/membership/membership.repository";
import { ProjectMembershipRepository } from "./membership/membership.repository";
import { ProjectRepository } from "./project.repository";

export class ProjectPolicy {
  constructor(
    private readonly projectRepo: ProjectRepository,
    private readonly orgRepo: OrgMembershipRepository,
    private readonly projectMemberRepo: ProjectMembershipRepository,
  ) {}

  async can(params: {
    userId: string;
    orgId: string;
    projectId?: string;
    action: ProjectAction;
  }): Promise<boolean> {
    const orgmembership = await this.orgRepo.findByUserAndOrg(
      params.userId,
      params.orgId,
    );
    if (!orgmembership) return false;

    // project:list only requires org membership — no specific project needed
    if (params.action === "project:list") return true;

    if (!params.projectId) return false;

    const project = await this.projectRepo.findById(params.projectId);
    if (!project) return false;

    if (project.orgId !== params.orgId) return false;

    // Org Owner can do anything
    if (orgmembership.role === "ORG_OWNER") return true;

    // Org Admin can do anything except delete
    if (
      orgmembership.role === "ORG_ADMIN" &&
      params.action !== "project:delete"
    ) {
      return true;
    }

    const projectMembership = await this.projectMemberRepo.findByProjectAndUser(
      params.projectId,
      params.userId,
    );
    if (!projectMembership) return false;

    switch (params.action) {
      case "project:view":
        return true;
      case "project:update":
        if (projectMembership.role === "PROJECT_OWNER") return true;
        if (orgmembership.role === "ORG_ADMIN") return true;
        return false;
      case "project:delete":
        return projectMembership.role === "PROJECT_OWNER";
      default:
        return false;
    }
  }

  async assert(params: {
    userId: string;
    orgId: string;
    projectId?: string;
    action: ProjectAction;
  }) {
    const allowed = await this.can(params);
    if (!allowed) {
      throw new Error("Not allowed to perform this action");
    }
  }
}
