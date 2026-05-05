import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

const globalForDb = global as unknown as {
  _db: ReturnType<typeof drizzle<typeof schema>> | undefined;
};

export function getDb() {
  if (!globalForDb._db) {
    const client = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false });
    globalForDb._db = drizzle(client, { schema });
  }
  return globalForDb._db!;
}
