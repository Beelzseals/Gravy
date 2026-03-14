import { db } from "../../infra/db/client";
import { projects } from "./project.schema";
import { eq, and } from "drizzle-orm";
import { DbTx } from "../../infra/db/transaction";

interface Project {
  id: string;
  name: string;
  orgId: string;
}

type ProjectStatus = "ACTIVE" | "ARCHIVED";

export class ProjectRepository {
  async findById(id: string): Promise<Project | null> {
    const res = await db.select().from(projects).where(eq(projects.id, id));
    return res[0] ?? null;
  }

  async findByIdScoped(orgId: string, projectId: string, tx?: DbTx) {
    const rows = await (tx ?? db)
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.orgId, orgId)));

    return rows[0] ?? null;
  }

  async create(
    input: { orgId: string; name: string; status?: ProjectStatus | null },
    tx?: DbTx,
  ) {
    const query = (tx ?? db)
      .insert(projects)
      .values({
        orgId: input.orgId,
        name: input.name,
        status: input.status ?? "ACTIVE",
      })
      .returning();

    const rows = await query;
    return rows[0];
  }

  async list(orgId: string, tx?: DbTx) {
    const query = (tx ?? db)
      .select()
      .from(projects)
      .where(eq(projects.orgId, orgId));
    const rows = await query;
    return rows;
  }
}
