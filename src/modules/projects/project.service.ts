import { ProjectRepository } from "./project.repository";
import { ProjectMembershipRepository } from "./membership/membership.repository";
import { ProjectPolicy } from "./project.policy";
import { db } from "../../infra/db/client";
import { OrganizationPolicy } from "../organizations/organization.policy";

export class ProjectService {
  constructor(
    private projects: ProjectRepository,
    private projectMembers: ProjectMembershipRepository,
    private readonly orgPolicy: OrganizationPolicy,
    private readonly projectPolicy: ProjectPolicy,
  ) {}

  async listProjects(userId: string, orgId: string): Promise<any> {
   return db.transaction(async (tx) => {
      await this.projectPolicy.assert({
        userId,
        orgId,
        action: "project:list",
      });
      const projects = await this.projects.list(orgId);
      return projects;
    });
  }

  async createProject(params: { userId: string; orgId: string; name: string }) {
    return db.transaction(async (tx) => {
      await this.orgPolicy.assert({
        userId: params.userId,
        orgId: params.orgId,
        action: "project:create",
      });

      const project = await this.projects.create(
        { orgId: params.orgId, name: params.name },
        tx,
      );

      // set creator as project owner
      await this.projectMembers.create(
        { projectId: project.id, userId: params.userId, role: "PROJECT_OWNER" },
        tx,
      );

      return project;
    });
  }
}
