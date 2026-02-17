import { db } from "../../../infra/db/client";
import { projectMemberships } from "../membership/membership.schema";
import { eq, and } from "drizzle-orm";
import { PROJECT_ROLE } from "../../../core/authorization/policies";

interface ProjectMembership {
  id: string;
  projectId: string;
  userId: string;
  role: PROJECT_ROLE | null;
  createdAt: Date;
  updatedAt: Date | null;
}
//TEMPORARY, TODO later
interface Transaction {
  insert: typeof db.insert;
  select: typeof db.select;
  delete: typeof db.delete;
  update: typeof db.update;
}

export class ProjectMembershipRepository {
  async findByProjectAndUser(
    projectId: string,
    userId: string,
  ): Promise<ProjectMembership | null> {
    const res = await db
      .select()
      .from(projectMemberships)
      .where(
        and(
          eq(projectMemberships.projectId, projectId),
          eq(projectMemberships.userId, userId),
        ),
      );
    return res.length > 0 ? res[0] : null;
  }

  async findByProject(projectId: string): Promise<ProjectMembership[]> {
    const res = await db
      .select()
      .from(projectMemberships)
      .where(eq(projectMemberships.projectId, projectId));
    return res;
  }

  async countOwners(projectId: string): Promise<number> {
    const res = await db
      .select()
      .from(projectMemberships)
      .where(
        and(
          eq(projectMemberships.projectId, projectId),
          eq(projectMemberships.role, "PROJECT_OWNER"),
        ),
      );
    return res.length;
  }

  async create(
    data: {
      projectId: string;
      userId: string;
      role: PROJECT_ROLE;
    },
    tx?: Transaction,
  ): Promise<ProjectMembership> {
    const res = await (tx ?? db)
      .insert(projectMemberships)
      .values({
        projectId: data.projectId,
        userId: data.userId,
        role: data.role,
      })
      .returning();
    return res[0];
  }

  updateRole(
    projectId: string,
    userId: string,
    role: PROJECT_ROLE,
    tx?: Transaction,
  ) {
    return (tx ?? db)
      .update(projectMemberships)
      .set({ role })
      .where(
        and(
          eq(projectMemberships.projectId, projectId),
          eq(projectMemberships.userId, userId),
        ),
      );
  }

  async delete(
    projectId: string,
    userId: string,
    tx?: Transaction,
  ): Promise<void> {
    await (tx ?? db)
      .delete(projectMemberships)
      .where(
        and(
          eq(projectMemberships.projectId, projectId),
          eq(projectMemberships.userId, userId),
        ),
      );
  }
}
