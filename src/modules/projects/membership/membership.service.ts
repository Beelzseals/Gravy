import { PROJECT_ROLE } from "../../../core/authorization/policies";
import { ProjectMembershipRepository } from "./membership.repository";

export class ProjectMembershipService {
  constructor(private membershipRepo: ProjectMembershipRepository) {}

  async removeMember(projectId: string, userId: string): Promise<void> {
    const membership = await this.membershipRepo.findByProjectAndUser(
      projectId,
      userId,
    );

    if (!membership) return;

    if (membership.role === "PROJECT_OWNER") {
      const count = await this.membershipRepo.countOwners(projectId);

      if (Number(count) <= 1) {
        throw new Error("Cannot remove the last project owner");
      }
    }

    await this.membershipRepo.delete(projectId, userId);
  }

  /*
   * Updates a member's role within a project, ensuring that the last project owner cannot be demoted.
   */
  async updateRole(
    projectId: string,
    userId: string,
    newRole: PROJECT_ROLE,
  ): Promise<void> {
    const membership = await this.membershipRepo.findByProjectAndUser(
      projectId,
      userId,
    );

    if (!membership) {
      throw new Error("Membership not found");
    }

    if (membership.role === "PROJECT_OWNER" && newRole !== "PROJECT_OWNER") {
      const count = await this.membershipRepo.countOwners(projectId);

      if (Number(count) <= 1) {
        throw new Error("Cannot demote the last project owner");
      }
    }

    await this.membershipRepo.updateRole(projectId, userId, newRole);
  }
}
