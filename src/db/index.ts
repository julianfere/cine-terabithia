import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

const globalForDb = global as unknown as {
  _pool: Pool | undefined;
  _db: ReturnType<typeof drizzle<typeof schema>> | undefined;
};

export function getDb() {
  if (!globalForDb._db) {
    globalForDb._pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 1,
    });
    globalForDb._db = drizzle(globalForDb._pool, { schema });
  }
  return globalForDb._db!;
}
