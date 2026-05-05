import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const movies = sqliteTable('movies', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tmdbId: integer('tmdb_id'),
  title: text('title').notNull(),
  originalTitle: text('original_title'),
  year: integer('year'),
  director: text('director'),
  posterPath: text('poster_path'),
  synopsis: text('synopsis'),
  posterHue: integer('poster_hue').default(200),
  duration: integer('duration'),
  genre: text('genre'),
  createdAt: integer('created_at').default(0),
});

export const screenings = sqliteTable('screenings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  movieId: integer('movie_id').references(() => movies.id),
  scheduledDate: text('scheduled_date').notNull(),
  hour: text('hour'),
  notes: text('notes'),
  status: text('status').notNull().default('upcoming'),
  snack: text('snack'),
  location: text('location'),
  curatedBy: text('curated_by'),
  createdAt: integer('created_at').default(0),
});

export const scores = sqliteTable('scores', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  screeningId: integer('screening_id').references(() => screenings.id),
  username: text('username').notNull(),
  score: integer('score').notNull(),
  comment: text('comment'),
  createdAt: integer('created_at').default(0),
});

export const recommendations = sqliteTable('recommendations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tmdbId: integer('tmdb_id'),
  title: text('title').notNull(),
  posterPath: text('poster_path'),
  year: integer('year'),
  director: text('director'),
  duration: integer('duration'),
  genre: text('genre'),
  posterHue: integer('poster_hue').default(200),
  suggestedBy: text('suggested_by').notNull(),
  reason: text('reason'),
  featured: integer('featured').default(0),
  createdAt: integer('created_at').default(0),
});

export const recommendationVotes = sqliteTable('recommendation_votes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  recommendationId: integer('recommendation_id').references(() => recommendations.id),
  username: text('username').notNull(),
  createdAt: integer('created_at').default(0),
});

export const screeningVotes = sqliteTable('screening_votes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  screeningId: integer('screening_id').references(() => screenings.id),
  recommendationId: integer('recommendation_id').references(() => recommendations.id),
  username: text('username').notNull(),
  createdAt: integer('created_at').default(0),
});

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  role: text('role').notNull().default('user'),
  displayName: text('display_name'),
  avatar: text('avatar'),
  createdAt: integer('created_at').default(0),
});
