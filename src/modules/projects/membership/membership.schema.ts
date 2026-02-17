import { pgTable, pgEnum, timestamp, uuid, index } from "drizzle-orm/pg-core";
import { users } from "../../users/user.schema";
import { projects } from "../project.schema";
import { PROJECT_ROLE } from "../../../core/authorization/policies";

export const projectRole = pgEnum("project_role", [
  "PROJECT_OWNER",
  "PROJECT_EDITOR",
  "PROJECT_VIEWER",
]);

export const projectMemberships = pgTable(
  "project_memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id)
      .unique(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id)
      .unique(),
    role: projectRole("role"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_project_memberships_project_id").on(table.projectId),
    index("idx_project_memberships_user_id").on(table.userId),
  ],
);
