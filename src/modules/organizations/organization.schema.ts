import { pgTable, varchar, timestamp, pgEnum, uuid } from "drizzle-orm/pg-core";
import { users } from "../users/user.schema";

export const orgRoleEnum = pgEnum("org_role", [
  "OWNER",
  "ADMIN",
  "MEMBER",
  "VIEWER",
]);

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  billingPlan: varchar("billing_plan", { length: 50 }).notNull(),
  stripeId: varchar("stripe_id", { length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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
