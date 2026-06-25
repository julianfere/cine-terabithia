import { pgTable, text, integer, serial, bigint, boolean, unique, index } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  role: text('role').notNull().default('user'),
  displayName: text('display_name'),
  avatar: text('avatar'),
  lastSeenChangelog: bigint('last_seen_changelog', { mode: 'number' }),
  createdAt: bigint('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
});

export const movies = pgTable('movies', {
  id: serial('id').primaryKey(),
  tmdbId: integer('tmdb_id').unique(),
  title: text('title').notNull(),
  originalTitle: text('original_title'),
  year: integer('year'),
  director: text('director'),
  posterPath: text('poster_path'),
  synopsis: text('synopsis'),
  posterHue: integer('poster_hue').default(200),
  duration: integer('duration'),
  genre: text('genre'),
  createdAt: bigint('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
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
  createdAt: bigint('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
});

export const scores = pgTable('scores', {
  id: serial('id').primaryKey(),
  screeningId: integer('screening_id').references(() => screenings.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  score: integer('score').notNull(),
  comment: text('comment'),
  createdAt: bigint('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
}, (t) => ({
  uniqueScore: unique().on(t.screeningId, t.userId),
}));

// recommendations ya no duplica metadata de películas — referencia movies
export const recommendations = pgTable('recommendations', {
  id: serial('id').primaryKey(),
  movieId: integer('movie_id').references(() => movies.id).notNull(),
  suggestedById: integer('suggested_by_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  reason: text('reason'),
  featured: boolean('featured').default(false),
  status: text('status').notNull().default('active'), // 'active' | 'assigned'
  createdAt: bigint('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
});

export const recommendationVotes = pgTable('recommendation_votes', {
  id: serial('id').primaryKey(),
  recommendationId: integer('recommendation_id').references(() => recommendations.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
}, (t) => ({
  uniqueVote: unique().on(t.recommendationId, t.userId),
}));

export const screeningVotes = pgTable('screening_votes', {
  id: serial('id').primaryKey(),
  screeningId: integer('screening_id').references(() => screenings.id, { onDelete: 'cascade' }),
  recommendationId: integer('recommendation_id').references(() => recommendations.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
}, (t) => ({
  uniqueVote: unique().on(t.screeningId, t.userId),
}));

export const attendances = pgTable('attendances', {
  id: serial('id').primaryKey(),
  screeningId: integer('screening_id').references(() => screenings.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
}, (t) => ({
  uniqueAttendance: unique().on(t.screeningId, t.userId),
}));

export const recommendationComments = pgTable('recommendation_comments', {
  id: serial('id').primaryKey(),
  recommendationId: integer('recommendation_id').references(() => recommendations.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
});

export const recommendationCommentVotes = pgTable('recommendation_comment_votes', {
  id: serial('id').primaryKey(),
  commentId: integer('comment_id').references(() => recommendationComments.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  value: integer('value').notNull(), // 1 = upvote, -1 = downvote
  createdAt: bigint('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
}, (t) => ({
  uniqueVote: unique().on(t.commentId, t.userId),
  commentIdx: index().on(t.commentId),
}));

export const pushSubscriptions = pgTable('push_subscriptions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
});

export const pageViews = pgTable('page_views', {
  id: serial('id').primaryKey(),
  path: text('path').notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  sessionId: text('session_id'),
  userAgent: text('user_agent'),
  createdAt: bigint('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
});

export const notificationLogs = pgTable('notification_logs', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  url: text('url').notNull().default('/'),
  sentByUserId: integer('sent_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  recipientType: text('recipient_type').notNull().default('all'), // 'all' | 'custom'
  recipientUserIds: text('recipient_user_ids'), // JSON array when custom
  sent: integer('sent').notNull().default(0),
  failed: integer('failed').notNull().default(0),
  sentAt: bigint('sent_at', { mode: 'number' }).$defaultFn(() => Date.now()),
});

// --- Trivia ---

export const triviaGames = pgTable('trivia_games', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  screeningId: integer('screening_id').references(() => screenings.id, { onDelete: 'set null' }),
  status: text('status').notNull().default('draft'), // 'draft' | 'lobby' | 'active' | 'finished'
  currentQuestionIndex: integer('current_question_index').notNull().default(-1),
  createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: bigint('created_at', { mode: 'number' }).$defaultFn(() => Date.now()),
  startedAt: bigint('started_at', { mode: 'number' }),
  finishedAt: bigint('finished_at', { mode: 'number' }),
});

export const triviaQuestions = pgTable('trivia_questions', {
  id: serial('id').primaryKey(),
  gameId: integer('game_id').references(() => triviaGames.id, { onDelete: 'cascade' }).notNull(),
  order: integer('order').notNull().default(0),
  text: text('text').notNull(),
  type: text('type').notNull().default('open'), // 'multiple_choice' | 'open'
  points: integer('points').notNull().default(1),
  imageUrl: text('image_url'),
});

export const triviaOptions = pgTable('trivia_options', {
  id: serial('id').primaryKey(),
  questionId: integer('question_id').references(() => triviaQuestions.id, { onDelete: 'cascade' }).notNull(),
  text: text('text').notNull(),
  isCorrect: boolean('is_correct').notNull().default(false),
  order: integer('order').notNull().default(0),
});

export const triviaTeams = pgTable('trivia_teams', {
  id: serial('id').primaryKey(),
  gameId: integer('game_id').references(() => triviaGames.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  color: text('color').notNull().default('#e46217'),
});

export const triviaTeamMembers = pgTable('trivia_team_members', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').references(() => triviaTeams.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
}, (t) => ({
  uniqueMembership: unique().on(t.teamId, t.userId),
}));

export const triviaAnswers = pgTable('trivia_answers', {
  id: serial('id').primaryKey(),
  questionId: integer('question_id').references(() => triviaQuestions.id, { onDelete: 'cascade' }).notNull(),
  teamId: integer('team_id').references(() => triviaTeams.id, { onDelete: 'cascade' }).notNull(),
  optionId: integer('option_id').references(() => triviaOptions.id, { onDelete: 'set null' }), // null para preguntas open
  isCorrect: boolean('is_correct').notNull().default(false),
  pointsAwarded: integer('points_awarded').notNull().default(0),
  answeredAt: bigint('answered_at', { mode: 'number' }).$defaultFn(() => Date.now()),
}, (t) => ({
  uniqueAnswer: unique().on(t.questionId, t.teamId),
}));
