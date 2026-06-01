CREATE TABLE IF NOT EXISTS "page_views" (
  "id" serial PRIMARY KEY NOT NULL,
  "path" text NOT NULL,
  "user_id" integer REFERENCES "users"("id") ON DELETE SET NULL,
  "session_id" text,
  "user_agent" text,
  "created_at" bigint DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
);
