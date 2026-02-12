import { sessions } from "./session.schema";
import { db } from "../../infra/db/client";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export class AuthRepository {
  async createSession(userId: string) {
    const refreshToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const res = await db
      .insert(sessions)
      .values({ userId, refreshToken, expiresAt })
      .returning();
    return res[0];
  }

  async findSessionByRefreshToken(refreshToken: string) {
    const res = await db
      .select()
      .from(sessions)
      .where(eq(sessions.refreshToken, refreshToken));
    return res[0];
  }

  async revokeSession(refreshToken: string) {
    await db.delete(sessions).where(eq(sessions.refreshToken, refreshToken));
  }
}
