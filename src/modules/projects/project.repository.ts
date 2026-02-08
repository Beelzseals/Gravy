import { db } from "../../infra/db/client";
import { projects } from "./project.schema";
import { eq, and } from "drizzle-orm";

export class ProjectRepository {
  async findById(id: string) {
    return await db.select().from(projects).where(eq(projects.id, id));
  }

  async findByOrgId(orgId: string) {
    return await db.select().from(projects).where(eq(projects.orgId, orgId));
  }

  async create(name: string, orgId: string) {
    const res = await db.insert(projects).values({ name, orgId }).returning();
    return res[0];
  }
}
