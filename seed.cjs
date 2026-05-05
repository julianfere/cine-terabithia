const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const db = new Database('./cine.db');
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = OFF');

db.exec(`
  DELETE FROM screening_votes;
  DELETE FROM recommendation_votes;
  DELETE FROM scores;
  DELETE FROM recommendations;
  DELETE FROM screenings;
  DELETE FROM movies;
  DELETE FROM users;
  DELETE FROM sqlite_sequence WHERE name IN ('movies','screenings','scores','recommendations','recommendation_votes','screening_votes','users');
`);

db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS movies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    created_at INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS screenings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    movie_id INTEGER REFERENCES movies(id),
    scheduled_date TEXT NOT NULL,
    hour TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'upcoming',
    snack TEXT,
    location TEXT,
    curated_by TEXT,
    created_at INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    screening_id INTEGER REFERENCES screenings(id),
    username TEXT NOT NULL,
    score INTEGER NOT NULL,
    comment TEXT,
    created_at INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    created_at INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS recommendation_votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recommendation_id INTEGER REFERENCES recommendations(id),
    username TEXT NOT NULL,
    created_at INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS screening_votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    screening_id INTEGER REFERENCES screenings(id),
    recommendation_id INTEGER REFERENCES recommendations(id),
    username TEXT NOT NULL,
    created_at INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at INTEGER DEFAULT 0
  );
`);

const insertUser = db.prepare(`INSERT INTO users (username, password, role, created_at) VALUES (?,?,?,?)`);
insertUser.run('admin', bcrypt.hashSync('terabithia2024', 10), 'admin', Date.now());
console.log('✓ Admin user created');

console.log('\n✓ Database seeded successfully.');
db.close();
