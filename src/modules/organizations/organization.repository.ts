import { db } from "../../infra/db/client";
import { organizations, orgMemberships } from "./organization.schema";
import { eq, and } from "drizzle-orm";

export class OrganizationRepository {
  async findById(id: string) {
    return await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id));
  }

  async getUserRole(userId: string, orgId: string) {
    const res = await db
      .select()
      .from(orgMemberships)
      .where(
        and(eq(orgMemberships.userId, userId), eq(orgMemberships.orgId, orgId)),
      );
    return res[0]?.role || null;
  }
}
