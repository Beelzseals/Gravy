import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import { users } from "../users/user.schema";

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  refreshToken: varchar("refresh_token", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
