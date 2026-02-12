import { users } from "./user.schema";
import { db } from "../../infra/db/client";
import { eq, and } from "drizzle-orm";

export class UserRepository {
  async findByEmail(email: string) {
    const res = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .then((res) => res[0]);
    return res ?? null;
  }

  async findById(id: string) {
    const res = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .then((res) => res[0]);
    return res ?? null;
  }
}
