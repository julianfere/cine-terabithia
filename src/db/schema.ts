import { pgTable, text, integer, serial, bigint } from 'drizzle-orm/pg-core';

export const movies = pgTable('movies', {
  id: serial('id').primaryKey(),
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
  createdAt: bigint('created_at', { mode: 'number' }).default(0),
});

export const screenings = pgTable('screenings', {
  id: serial('id').primaryKey(),
  movieId: integer('movie_id').references(() => movies.id),
  scheduledDate: text('scheduled_date').notNull(),
  hour: text('hour'),
  notes: text('notes'),
  status: text('status').notNull().default('upcoming'),
  snack: text('snack'),
  location: text('location'),
  curatedBy: text('curated_by'),
  createdAt: bigint('created_at', { mode: 'number' }).default(0),
});

export const scores = pgTable('scores', {
  id: serial('id').primaryKey(),
  screeningId: integer('screening_id').references(() => screenings.id),
  username: text('username').notNull(),
  score: integer('score').notNull(),
  comment: text('comment'),
  createdAt: bigint('created_at', { mode: 'number' }).default(0),
});

export const recommendations = pgTable('recommendations', {
  id: serial('id').primaryKey(),
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
  createdAt: bigint('created_at', { mode: 'number' }).default(0),
});

export const recommendationVotes = pgTable('recommendation_votes', {
  id: serial('id').primaryKey(),
  recommendationId: integer('recommendation_id').references(() => recommendations.id),
  username: text('username').notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).default(0),
});

export const screeningVotes = pgTable('screening_votes', {
  id: serial('id').primaryKey(),
  screeningId: integer('screening_id').references(() => screenings.id),
  recommendationId: integer('recommendation_id').references(() => recommendations.id),
  username: text('username').notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).default(0),
});

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  role: text('role').notNull().default('user'),
  displayName: text('display_name'),
  avatar: text('avatar'),
  createdAt: bigint('created_at', { mode: 'number' }).default(0),
});
