import { sessions } from "./session.schema";
import { db } from "../../infra/db/client";
import { eq, isNull, and, sql } from "drizzle-orm";
import { generateSecureToken, hashToken } from "./token.util";

export interface SessionInput {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  parentTokenId?: string;
  userAgent?: string;
  ipAddress?: string;
}

export class SessionRepository {
  async createSession(input: SessionInput) {
    const res = await db
      .insert(sessions)
      .values({
        userId: input.userId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        parentTokenId: input.parentTokenId ?? null,
        userAgent: input.userAgent,
        ipAddress: input.ipAddress,
      })
      .returning();
    return res?.[0];
  }

  async findByTokenHash(tokenHash: string) {
    const res = await db
      .select()
      .from(sessions)
      .where(eq(sessions.tokenHash, tokenHash));
    return res?.[0];
  }

  async findChild(parentId: string) {
    const result = await db
      .select()
      .from(sessions)
      .where(eq(sessions.parentTokenId, parentId));

    return result[0] ?? null;
  }

  async revokeSessionChain(tokenHash: string) {
    return await db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(sessions.tokenHash, tokenHash), isNull(sessions.revokedAt)))
      .returning();
  }

  /**
   * Insert rotated session (child)
   */
  async insertRotatedSession(input: SessionInput) {
    const result = await db
      .insert(sessions)
      .values({
        userId: input.userId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        parentTokenId: input.parentTokenId ?? null,
        userAgent: input.userAgent ?? null,
        ipAddress: input.ipAddress ?? null,
      })
      .returning();

    return result[0];
  }

  /**
   * Mark entire session chain as compromised
   * Uses recursive CTE to:
   * 1. Traverse upward to root
   * 2. Traverse downward to all descendants
   * 3. Revoke + mark compromised
   */
  async markSessionCompromised(sessionId: string) {
    await db.execute(sql`
      WITH RECURSIVE upward AS (
        SELECT id, parent_token_id
        FROM sessions
        WHERE id = ${sessionId}

        UNION ALL

        SELECT s.id, s.parent_token_id
        FROM sessions s
        INNER JOIN upward u
          ON s.id = u.parent_token_id
      ),
      root AS (
        SELECT id
        FROM upward
        WHERE parent_token_id IS NULL
        LIMIT 1
      ),
      full_chain AS (
        SELECT id
        FROM root

        UNION ALL

        SELECT s.id
        FROM sessions s
        INNER JOIN full_chain fc
          ON s.parent_token_id = fc.id
      )
      UPDATE sessions
      SET revoked_at = NOW(),
          compromised_at = NOW()
      WHERE id IN (SELECT id FROM full_chain);
    `);
  }

  /**
   * Update last used timestamp
   */
  async touch(sessionId: string) {
    await db
      .update(sessions)
      .set({ lastUsedAt: new Date() })
      .where(eq(sessions.id, sessionId));
  }
}
