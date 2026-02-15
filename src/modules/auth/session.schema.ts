import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import { InferSelectModel } from "drizzle-orm";
import { users } from "../users/user.schema";

// @ts-ignore
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  tokenHash: varchar("token_hash").notNull(),
  // @ts-ignore
  // prettier-ignore
  parentTokenId: uuid("parent_token_id").references((): typeof sessions => sessions).id,
  revokedAt: timestamp("revoked_at"),
  compromisedAt: timestamp("compromised_at"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastUsedAt: timestamp("last_used_at"),
  userAgent: varchar("user_agent"),
  ipAddress: varchar("ip_address"),
});

export type Session = InferSelectModel<typeof sessions>;
