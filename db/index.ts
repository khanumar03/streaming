import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import { envConfig } from "../config/env.config.js";
import * as schema from "../drizzle/index.js";

let pool: pg.Pool;
export let db: NodePgDatabase<typeof schema>;

export function initDatabase(): void {
  if (!envConfig.databaseUrl) {
    throw new Error("Database connection URL is missing in envConfig.");
  }

  if (!globalThis.__dbPool__) {
    globalThis.__dbPool__ = new pg.Pool({
      connectionString: envConfig.databaseUrl,
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }

  pool = globalThis.__dbPool__;
  db = drizzle(pool, { schema });
}
