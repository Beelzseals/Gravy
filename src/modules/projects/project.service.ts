import { ProjectRepository } from "./project.repository";
import { OrganizationRepository } from "../organizations/organization.repository";
import { hasRequiredRole } from "../../core/authorization/policies";

export class ProjectService {
  constructor(
    private projectRepo: ProjectRepository,
    private orgRepo: OrganizationRepository,
  ) {}

  async listProjects(userId: string, orgId: string) {
    const userRole = await this.orgRepo.getUserRole(userId, orgId);
    if (!userRole) throw new Error("User is not a member of the organization");

    return await this.projectRepo.findByOrgId(orgId);
  }

  async createProject(name: string, userId: string, orgId: string) {
    const userRole = await this.orgRepo.getUserRole(userId, orgId);
    if (!userRole || !hasRequiredRole(userRole, "MEMBER"))
      throw new Error("User is not a member of the organization");

    return await this.projectRepo.create(name, orgId);
  }
}
