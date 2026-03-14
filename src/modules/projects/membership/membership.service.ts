import { OrgRole, ProjectRole } from "../../../core/authorization/roles";
import { db } from "../../../infra/db/client";
import { DbTx } from "../../../infra/db/transaction";
import { OrgMembershipRepository } from "../../organizations/membership/membership.repository";
import { ProjectPolicy } from "../project.policy";
import { ProjectRepository } from "../project.repository";
import { ProjectMembershipRepository } from "./membership.repository";
import {
  AddProjectMemberInput,
  ChangeProjectMemberRoleInput,
  RemoveProjectMemberInput,
  ProjectMembership,
} from "./membership.types";

export class ProjectMembershipService {
  constructor(
    private orgMembershipRepository: OrgMembershipRepository,
    private projectMembershipRepository: ProjectMembershipRepository,
    private projectPolicy: ProjectPolicy,
    private projectRepository: ProjectRepository,
  ) {}

  private async getAuthorizationContext(
    actorUserId: string,
    projectId: string,
    orgId: string,
  ) {
    const [orgMembership, projectMembership] = await Promise.all([
      this.orgMembershipRepository.findByUserAndOrg(actorUserId, orgId),
      this.projectMembershipRepository.findByProjectAndUser(
        projectId,
        actorUserId,
      ),
    ]);

    return {
      orgId,
      orgRole: orgMembership?.role ?? null,
      projectRole: projectMembership?.role ?? null,
    };
  }

  async listProjectMembers(
    actorUserId: string,
    projectId: string,
  ): Promise<ProjectMembership[]> {
    const project = await this.projectRepository.findById(projectId);
    if (!project) throw new Error("Project not found.");

    const auth = await this.getAuthorizationContext(
      actorUserId,
      projectId,
      project.orgId,
    );

    this.projectPolicy.assert("view", {
      actorUserId,
      orgId: project.orgId,
      projectId,
      orgRole: auth.orgRole,
      projectRole: auth.projectRole,
    });

    return this.projectMembershipRepository.listByProject(projectId);
  }

  async addProjectMember(
    input: AddProjectMemberInput,
  ): Promise<ProjectMembership> {
    const { actorUserId, projectId, targetUserId, role } = input;

    if (actorUserId === targetUserId && role !== "PROJECT_OWNER") {
      throw new Error(
        "Self-adding is only valid during ownership bootstrap or explicit owner management.",
      );
    }

    const project = await this.projectRepository.findById(projectId);
    if (!project) throw new Error("Project not found.");

    const auth = await this.getAuthorizationContext(
      actorUserId,
      projectId,
      project.orgId,
    );

    this.projectPolicy.assert("inviteMember", {
      actorUserId,
      orgId: project.orgId,
      projectId,
      orgRole: auth.orgRole,
      projectRole: auth.projectRole,
    });

    const existing =
      await this.projectMembershipRepository.findByProjectAndUser(
        projectId,
        targetUserId,
      );
    if (existing) {
      throw new Error("User is already a project member.");
    }

    const targetOrgMembership =
      await this.orgMembershipRepository.findByUserAndOrg(
        targetUserId,
        project.orgId,
      );
    if (!targetOrgMembership) {
      throw new Error(
        "Target user must belong to the organization before being added to the project.",
      );
    }

    return this.projectMembershipRepository.create({
      projectId,
      userId: targetUserId,
      role,
    });
  }

  async changeProjectMemberRole(
    input: ChangeProjectMemberRoleInput,
  ): Promise<ProjectMembership> {
    const { actorUserId, projectId, targetUserId, role: newRole } = input;

    const project = await this.projectRepository.findById(projectId);
    if (!project) throw new Error("Project not found.");

    return db.transaction(async (tx: DbTx): Promise<ProjectMembership> => {
      const auth = await this.getAuthorizationContext(
        actorUserId,
        projectId,
        project.orgId,
      );

      this.projectPolicy.assert("changeMemberRole", {
        actorUserId,
        orgId: project.orgId,
        projectId,
        orgRole: auth.orgRole,
        projectRole: auth.projectRole,
      });

      const existingMembership =
        await this.projectMembershipRepository.findByProjectAndUser(
          projectId,
          targetUserId,
        );

      if (!existingMembership) {
        throw new Error("Project membership not found.");
      }

      if (existingMembership.role === newRole) {
        return existingMembership;
      }

      // Critical invariant:
      // if demoting an owner, ensure at least one owner remains
      if (
        existingMembership.role === "PROJECT_OWNER" &&
        newRole !== "PROJECT_OWNER"
      ) {
        const ownerCount =
          await this.projectMembershipRepository.countOwners(projectId);

        if (ownerCount <= 1) {
          throw new Error(
            "Project must always have at least one PROJECT_OWNER.",
          );
        }
      }

      return this.projectMembershipRepository.updateRole(
        {
          projectId,
          userId: targetUserId,
          role: newRole,
        },
        tx,
      );
    });
  }

  async removeProjectMember(input: RemoveProjectMemberInput) {
    const { actorUserId, projectId, targetUserId } = input;

    const project = await this.projectRepository.findById(projectId);
    if (!project) throw new Error("Project not found.");

    await db.transaction(async (tx: DbTx) => {
      const auth = await this.getAuthorizationContext(
        actorUserId,
        projectId,
        project.orgId,
      );

      this.projectPolicy.assert("removeMember", {
        actorUserId,
        orgId: project.orgId,
        projectId,
        orgRole: auth.orgRole,
        projectRole: auth.projectRole,
      });

      const membership =
        await this.projectMembershipRepository.findByProjectAndUser(
          projectId,
          targetUserId,
        );

      if (!membership) {
        throw new Error("Project membership not found.");
      }

      if (membership.role === "PROJECT_OWNER") {
        const ownerCount =
          await this.projectMembershipRepository.countOwners(projectId);

        if (ownerCount <= 1) {
          throw new Error(
            "Project must always have at least one PROJECT_OWNER.",
          );
        }
      }

      await this.projectMembershipRepository.delete(
        projectId,
        targetUserId,
        tx,
      );
    });
  }

  async getActorProjectAccess(
    actorUserId: string,
    projectId: string,
  ): Promise<{
    orgId: string;
    orgRole: OrgRole | null;
    projectRole: ProjectRole | null;
  }> {
    const project = await this.projectRepository.findById(projectId);
    if (!project) throw new Error("Project not found.");

    return this.getAuthorizationContext(actorUserId, projectId, project.orgId);
  }
}
