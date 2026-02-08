import { varchar, uuid, timestamp, pgTable, jsonb } from "drizzle-orm/pg-core";
import { organizations } from "../organizations/organization.schema";
import { users } from "../users/user.schema";

export const audit = pgTable("audit", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  action: varchar("action", { length: 255 }).notNull(),
  resourceType: varchar("resource_type", { length: 255 }).notNull(),
  resourceId: varchar("resource_id", { length: 255 }).notNull(),
  metadata: jsonb("metadata").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});
