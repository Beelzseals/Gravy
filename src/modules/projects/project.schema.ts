import {
  pgTable,
  varchar,
  timestamp,
  uuid,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";

const projectStatus = pgEnum("project_status", ["ACTIVE", "ARCHIVED"]);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: varchar("description", { length: 1000 }),
    status: projectStatus("status").notNull().default("ACTIVE"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [index("idx_projects_org_id").on(table.orgId)],
);
