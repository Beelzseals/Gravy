import { ProjectAction } from "../../core/authorization/actions";
import { OrganizationRepository } from "../organizations/organization.repository";
import { orgMemberships } from "../organizations/organization.schema";
import { ProjectMembershipRepository } from "./membership/membership.repository";
import { ProjectRepository } from "./project.repository";

export class ProjectPolicy {
  constructor(
    private readonly projectRepo: ProjectRepository,
    private readonly orgRepo: OrganizationRepository,
    private readonly projectMemberRepo: ProjectMembershipRepository,
  ) {}

  async can(params: {
    userId: string;
    orgId: string;
    projectId: string;
    action: ProjectAction;
  }): Promise<boolean> {
    const Orgmembership = await this.orgRepo.findByUserAndOrg(
      params.orgId,
      params.userId,
    );

    if (!Orgmembership) return false;

    const project = await this.projectRepo.findById(params.projectId);
    if (!project) return false;

    if (project.orgId !== params.orgId) return false;

    if (Orgmembership.role === "ORG_OWNER") return true;

    if (
      Orgmembership.role === "ORG_ADMIN" &&
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
        if (Orgmembership.role === "ORG_ADMIN") return true;
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
    projectId: string;
    action: ProjectAction;
  }) {
    const allowed = await this.can(params);
    if (!allowed) {
      throw new Error("Not allowed to perform this action");
    }
  }
}
