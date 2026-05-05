import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

const globalForDb = global as unknown as {
  _sqlite: InstanceType<typeof Database> | undefined;
  _db: ReturnType<typeof drizzle<typeof schema>> | undefined;
};

const MIGRATIONS = [
  'ALTER TABLE users ADD COLUMN display_name TEXT',
  'ALTER TABLE users ADD COLUMN avatar TEXT',
];

export function getDb() {
  if (!globalForDb._sqlite) {
    const sqlite = new Database(process.env.DATABASE_URL || './cine.db');
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('foreign_keys = ON');
    globalForDb._sqlite = sqlite;
    globalForDb._db = drizzle(sqlite, { schema });
  }
  for (const sql of MIGRATIONS) {
    try { globalForDb._sqlite.exec(sql); } catch {}
  }
  return globalForDb._db!;
}
