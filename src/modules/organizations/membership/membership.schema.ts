import { pgTable, timestamp, pgEnum, uuid } from "drizzle-orm/pg-core";
import { users } from "../../users/user.schema";
import { organizations } from "../organization.schema";

export const orgRoleEnum = pgEnum("org_role", [
  "ORG_OWNER",
  "ORG_ADMIN",
  "ORG_MEMBER",
  "ORG_VIEWER",
]);

export const orgMemberships = pgTable("org_memberships", {
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id),
  role: orgRoleEnum("role").notNull(),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});
