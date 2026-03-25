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
import { CustomError } from "../../../core/error/error.factory";

export class ProjectMembershipService {
  constructor(
    private orgMembershipRepository: OrgMembershipRepository,
    private projectMembershipRepository: ProjectMembershipRepository,
    private projectPolicy: ProjectPolicy,
    private projectRepository: ProjectRepository,
  ) {}

  /**
   * Helper method to fetch both org and project membership for a user in a single call.
   */
  private async getPolicyContext(
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
      actorUserId,
      orgId,
      projectId,
      orgRole: orgMembership?.role ?? null,
      projectRole: projectMembership?.role ?? null,
    };
  }

  /**
   * Resolves a project by its ID within a specific organization.
   * @returns The project if found.
   */
  private async resolveProject(orgId: string, projectId: string) {
    const project = await this.projectRepository.findByIdScoped(
      projectId,
      orgId,
    );
    if (!project) throw CustomError.notFound("Project not found");
    return project;
  }

  async listMembers(
    orgId: string,
    actorUserId: string,
    projectId: string,
  ): Promise<ProjectMembership[]> {
    const project = await this.resolveProject(orgId, projectId);

    const auth = await this.getPolicyContext(
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

  async addMember({
    actorUserId,
    projectId,
    targetUserId,
    role,
    orgId,
  }: AddProjectMemberInput): Promise<ProjectMembership> {
    if (actorUserId === targetUserId && role !== "PROJECT_OWNER") {
      throw CustomError.unprocessableEntity(
        "Cannot add yourself to the project unless you are a PROJECT_OWNER.",
      );
    }

    const project = await this.resolveProject(orgId, projectId);

    const auth = await this.getPolicyContext(
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

    const existingMembership =
      await this.projectMembershipRepository.findByProjectAndUser(
        projectId,
        targetUserId,
      );
    if (existingMembership) {
      throw CustomError.unprocessableEntity(
        "User is already a project member.",
      );
    }

    const targetOrgMembership =
      await this.orgMembershipRepository.findByUserAndOrg(
        targetUserId,
        project.orgId,
      );
    if (!targetOrgMembership) {
      throw CustomError.unprocessableEntity(
        "Target user must belong to the organization before being added to the project.",
      );
    }

    return this.projectMembershipRepository.create({
      projectId,
      userId: targetUserId,
      role,
    });
  }

  async changeRole({
    actorUserId,
    projectId,
    targetUserId,
    orgId,
    newRole,
  }: ChangeProjectMemberRoleInput): Promise<ProjectMembership> {
    const project = await this.resolveProject(orgId, projectId);
    if (!project) throw CustomError.notFound("Project not found.");

    return db.transaction(async (tx: DbTx): Promise<ProjectMembership> => {
      const auth = await this.getPolicyContext(
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
        throw CustomError.notFound("Project membership not found.");
      }

      if (existingMembership.role === newRole) {
        return existingMembership;
      }

      // if demoting an owner, ensure at least one owner remains
      if (
        existingMembership.role === "PROJECT_OWNER" &&
        newRole !== "PROJECT_OWNER"
      ) {
        const ownerCount =
          await this.projectMembershipRepository.countOwners(projectId);

        if (ownerCount <= 1) {
          throw CustomError.unprocessableEntity(
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

  async removeMember(input: RemoveProjectMemberInput) {
    const { actorUserId, projectId, targetUserId, orgId } = input;

    const project = await this.resolveProject(orgId, projectId);

    await db.transaction(async (tx: DbTx) => {
      const auth = await this.getPolicyContext(
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
        throw CustomError.notFound("Project membership not found.");
      }

      if (membership.role === "PROJECT_OWNER") {
        const ownerCount =
          await this.projectMembershipRepository.countOwners(projectId);

        if (ownerCount <= 1) {
          throw CustomError.unprocessableEntity(
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
    if (!project) throw CustomError.notFound("Project not found");

    return this.getPolicyContext(actorUserId, projectId, project.orgId);
  }
}
