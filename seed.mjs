import postgres from 'postgres';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'fs';

// Load DATABASE_URL from .env.local if not set
if (!process.env.DATABASE_URL) {
  try {
    const env = readFileSync('.env.local', 'utf-8');
    for (const line of env.split('\n')) {
      const [key, ...rest] = line.split('=');
      if (key?.trim() === 'DATABASE_URL') {
        process.env.DATABASE_URL = rest.join('=').trim();
        break;
      }
    }
  } catch {}
}

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL not set');
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', prepare: false });

console.log('Conectando a la base de datos...');

await sql`
  CREATE TABLE IF NOT EXISTS movies (
    id SERIAL PRIMARY KEY,
    tmdb_id INTEGER,
    title TEXT NOT NULL,
    original_title TEXT,
    year INTEGER,
    director TEXT,
    poster_path TEXT,
    synopsis TEXT,
    poster_hue INTEGER DEFAULT 200,
    duration INTEGER,
    genre TEXT,
    created_at BIGINT DEFAULT 0
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS screenings (
    id SERIAL PRIMARY KEY,
    movie_id INTEGER REFERENCES movies(id),
    scheduled_date TEXT NOT NULL,
    hour TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'upcoming',
    snack TEXT,
    location TEXT,
    curated_by TEXT,
    created_at BIGINT DEFAULT 0
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS scores (
    id SERIAL PRIMARY KEY,
    screening_id INTEGER REFERENCES screenings(id),
    username TEXT NOT NULL,
    score INTEGER NOT NULL,
    comment TEXT,
    created_at BIGINT DEFAULT 0
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS recommendations (
    id SERIAL PRIMARY KEY,
    tmdb_id INTEGER,
    title TEXT NOT NULL,
    poster_path TEXT,
    year INTEGER,
    director TEXT,
    duration INTEGER,
    genre TEXT,
    poster_hue INTEGER DEFAULT 200,
    suggested_by TEXT NOT NULL,
    reason TEXT,
    featured INTEGER DEFAULT 0,
    created_at BIGINT DEFAULT 0
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS recommendation_votes (
    id SERIAL PRIMARY KEY,
    recommendation_id INTEGER REFERENCES recommendations(id),
    username TEXT NOT NULL,
    created_at BIGINT DEFAULT 0
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS screening_votes (
    id SERIAL PRIMARY KEY,
    screening_id INTEGER REFERENCES screenings(id),
    recommendation_id INTEGER REFERENCES recommendations(id),
    username TEXT NOT NULL,
    created_at BIGINT DEFAULT 0
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    display_name TEXT,
    avatar TEXT,
    created_at BIGINT DEFAULT 0
  )
`;

console.log('✓ Tablas creadas');

const hash = bcrypt.hashSync('terabithia2024', 10);
await sql`
  INSERT INTO users (username, password, role, created_at)
  VALUES ('admin', ${hash}, 'admin', ${Date.now()})
  ON CONFLICT (username) DO NOTHING
`;

console.log('✓ Usuario admin creado (o ya existía)');
console.log('\n✓ Base de datos lista.');

await sql.end();
