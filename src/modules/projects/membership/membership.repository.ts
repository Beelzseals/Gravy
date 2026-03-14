import { db } from "../../../infra/db/client";
import { projectMemberships } from "../membership/membership.schema";
import { eq, and } from "drizzle-orm";
import {
  CreateProjectMembershipInput,
  UpdateProjectMembershipRoleInput,
  ProjectMembership,
} from "./membership.types";
import { DbTx } from "../../../infra/db/transaction";

export class ProjectMembershipRepository {
  async findByProjectAndUser(
    projectId: string,
    userId: string,
  ): Promise<ProjectMembership | null> {
    const query = await db
      .select()
      .from(projectMemberships)
      .where(
        and(
          eq(projectMemberships.projectId, projectId),
          eq(projectMemberships.userId, userId),
        ),
      );
    return query.length > 0 ? query[0] : null;
  }

  async findByProject(projectId: string): Promise<ProjectMembership[]> {
    const query = await db
      .select()
      .from(projectMemberships)
      .where(eq(projectMemberships.projectId, projectId));
    return query;
  }

  async countOwners(projectId: string) {
    const query = await db
      .select()
      .from(projectMemberships)
      .where(
        and(
          eq(projectMemberships.projectId, projectId),
          eq(projectMemberships.role, "PROJECT_OWNER"),
        ),
      );
    return query.length;
  }

  async listByProject(projectId: string): Promise<ProjectMembership[]> {
    const query = await db
      .select()
      .from(projectMemberships)
      .where(eq(projectMemberships.projectId, projectId));
    return query;
  }

  async create(
    input: CreateProjectMembershipInput,
    tx?: DbTx,
  ): Promise<ProjectMembership> {
    const query = await (tx ?? db)
      .insert(projectMemberships)
      .values({
        projectId: input.projectId,
        userId: input.userId,
        role: input.role,
      })
      .returning();
    return query[0];
  }

  async updateRole(
    input: UpdateProjectMembershipRoleInput,
    tx?: DbTx,
  ): Promise<ProjectMembership> {
    const query = await (tx ?? db)
      .update(projectMemberships)
      .set({ role: input.role })
      .where(
        and(
          eq(projectMemberships.projectId, input.projectId),
          eq(projectMemberships.userId, input.userId),
        ),
      )
      .returning();
    return query[0];
  }

  async delete(projectId: string, userId: string, tx?: DbTx) {
    const query = await (tx ?? db)
      .delete(projectMemberships)
      .where(
        and(
          eq(projectMemberships.projectId, projectId),
          eq(projectMemberships.userId, userId),
        ),
      )
      .returning();
    return query;
  }
}
