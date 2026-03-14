import { db } from "./client";

export type DbTx = Parameters<typeof db.transaction>[0] extends (
  tx: infer T,
) => any
  ? T
  : never;
