import { db } from "../../infra/db/client";
import { projects } from "./project.schema";
import { eq } from "drizzle-orm";

interface Project {
  id: string;
  name: string;
  orgId: string;
}

export class ProjectRepository {
  async findById(id: string): Promise<Project | null> {
    const res = await db.select().from(projects).where(eq(projects.id, id));
    return res.length > 0 ? res[0] : null;
  }

  async findByOrgId(orgId: string): Promise<Project | null> {
    const res = await db
      .select()
      .from(projects)
      .where(eq(projects.orgId, orgId));
    return res.length > 0 ? res[0] : null;
  }

  async create(name: string, orgId: string): Promise<Project> {
    const res = await db.insert(projects).values({ name, orgId }).returning();
    return res[0];
  }
}
