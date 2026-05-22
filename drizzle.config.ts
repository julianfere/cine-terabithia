import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';

const env = process.env.NODE_ENV ?? 'development';
config({ path: `.env.${env}.local`, override: false });
config({ path: '.env.local', override: false });
config({ path: `.env.${env}`, override: false });
config({ path: '.env', override: false });

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
