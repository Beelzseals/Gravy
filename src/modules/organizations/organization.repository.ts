import { db } from "../../infra/db/client";
import { organizations } from "./organization.schema";
import { eq, and } from "drizzle-orm";

export class OrganizationRepository {
  async findById(id: string) {
    return await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id));
  }
}
