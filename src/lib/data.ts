import { getDb } from '@/db';
import { movies, screenings, scores, recommendations, recommendationVotes, attendances, users } from '@/db/schema';
import { eq, desc, avg, count, asc, and, inArray } from 'drizzle-orm';
import type { ProfilesMap } from './profiles';

export type ScreeningRow = {
  id: number;
  movieId: number | null;
  scheduledDate: string;
  hour: string | null;
  status: string;
  snack: string | null;
  location: string | null;
  curatedBy: string | null;
  notes: string | null;
  title: string | null;
  year: number | null;
  director: string | null;
  genre: string | null;
  posterHue: number | null;
  posterPath: string | null;
  duration: number | null;
  synopsis: string | null;
  avgScore: number | null;
  scoreCount: number;
};

export type RecommendationRow = {
  id: number;
  movieId: number;
  title: string;
  year: number | null;
  director: string | null;
  genre: string | null;
  duration: number | null;
  posterHue: number | null;
  posterPath: string | null;
  tmdbId: number | null;
  suggestedById: number;
  suggestedBy: string;
  reason: string | null;
  featured: boolean | null;
  votes: number;
  voters: string[];
};

function buildScreeningQuery() {
  const db = getDb();
  return db
    .select({
      id: screenings.id,
      movieId: screenings.movieId,
      scheduledDate: screenings.scheduledDate,
      hour: screenings.hour,
      status: screenings.status,
      snack: screenings.snack,
      location: screenings.location,
      curatedBy: screenings.curatedBy,
      notes: screenings.notes,
      title: movies.title,
      year: movies.year,
      director: movies.director,
      genre: movies.genre,
      posterHue: movies.posterHue,
      posterPath: movies.posterPath,
      duration: movies.duration,
      synopsis: movies.synopsis,
    })
    .from(screenings)
    .leftJoin(movies, eq(screenings.movieId, movies.id));
}

async function attachAvgScores(rows: Omit<ScreeningRow, 'avgScore' | 'scoreCount'>[]): Promise<ScreeningRow[]> {
  if (rows.length === 0) return [];
  const db = getDb();
  const ids = rows.map((r) => r.id);
  const avgScores = await db
    .select({ screeningId: scores.screeningId, avg: avg(scores.score), cnt: count(scores.id) })
    .from(scores)
    .where(inArray(scores.screeningId, ids))
    .groupBy(scores.screeningId);
  const map = new Map(avgScores.map((s) => [s.screeningId, { avg: Number(s.avg || 0), cnt: Number(s.cnt) }]));
  return rows.map((r) => ({
    ...r,
    avgScore: map.get(r.id)?.avg ?? null,
    scoreCount: map.get(r.id)?.cnt ?? 0,
  }));
}

export async function getUpcomingScreening(): Promise<ScreeningRow | null> {
  const rows = await buildScreeningQuery()
    .where(eq(screenings.status, 'upcoming'))
    .orderBy(asc(screenings.scheduledDate))
    .limit(1);
  if (!rows[0]) return null;
  return (await attachAvgScores([rows[0]]))[0];
}

export async function getPastScreenings(): Promise<ScreeningRow[]> {
  const rows = await buildScreeningQuery()
    .where(eq(screenings.status, 'past'))
    .orderBy(desc(screenings.scheduledDate));
  return attachAvgScores(rows);
}

export async function getAllScreenings(): Promise<ScreeningRow[]> {
  const rows = await buildScreeningQuery().orderBy(desc(screenings.scheduledDate));
  return attachAvgScores(rows);
}

export async function getScreeningById(id: number): Promise<ScreeningRow | null> {
  const rows = await buildScreeningQuery().where(eq(screenings.id, id)).limit(1);
  if (!rows[0]) return null;
  return (await attachAvgScores([rows[0]]))[0];
}

export async function getScoresForScreening(screeningId: number) {
  const db = getDb();
  return db
    .select({
      id: scores.id,
      screeningId: scores.screeningId,
      userId: scores.userId,
      username: users.username,
      score: scores.score,
      comment: scores.comment,
      createdAt: scores.createdAt,
    })
    .from(scores)
    .innerJoin(users, eq(scores.userId, users.id))
    .where(eq(scores.screeningId, screeningId))
    .orderBy(desc(scores.score));
}

export async function getUserProfiles(): Promise<ProfilesMap> {
  const db = getDb();
  const rows = await db
    .select({ username: users.username, displayName: users.displayName, avatar: users.avatar })
    .from(users);
  const map: ProfilesMap = {};
  for (const u of rows) map[u.username] = { displayName: u.displayName ?? null, avatar: u.avatar ?? null };
  return map;
}

export async function getAttendanceForScreening(screeningId: number): Promise<{ username: string }[]> {
  const db = getDb();
  return db
    .select({ username: users.username })
    .from(attendances)
    .innerJoin(users, eq(attendances.userId, users.id))
    .where(eq(attendances.screeningId, screeningId));
}

export async function getUserRecommendationVotes(userId: number): Promise<number[]> {
  const db = getDb();
  const rows = await db
    .select({ id: recommendationVotes.recommendationId })
    .from(recommendationVotes)
    .where(eq(recommendationVotes.userId, userId));
  return rows.map((r) => r.id).filter((id): id is number => id !== null);
}

export async function getRecommendations(): Promise<RecommendationRow[]> {
  const db = getDb();

  const rows = await db
    .select({
      id: recommendations.id,
      movieId: recommendations.movieId,
      suggestedById: recommendations.suggestedById,
      reason: recommendations.reason,
      featured: recommendations.featured,
      createdAt: recommendations.createdAt,
      title: movies.title,
      year: movies.year,
      director: movies.director,
      genre: movies.genre,
      duration: movies.duration,
      posterHue: movies.posterHue,
      posterPath: movies.posterPath,
      tmdbId: movies.tmdbId,
    })
    .from(recommendations)
    .leftJoin(movies, eq(recommendations.movieId, movies.id));

  const userRows = await db.select({ id: users.id, username: users.username }).from(users);
  const userMap = new Map(userRows.map((u) => [u.id, u.username]));

  const voteRows = await db
    .select({ recId: recommendationVotes.recommendationId, username: users.username })
    .from(recommendationVotes)
    .innerJoin(users, eq(recommendationVotes.userId, users.id));

  const votersMap = new Map<number, string[]>();
  for (const v of voteRows) {
    if (!v.recId) continue;
    const arr = votersMap.get(v.recId) ?? [];
    arr.push(v.username);
    votersMap.set(v.recId, arr);
  }

  return rows
    .map((r) => ({
      ...r,
      title: r.title ?? '',
      suggestedBy: userMap.get(r.suggestedById) ?? '',
      voters: votersMap.get(r.id) ?? [],
      votes: (votersMap.get(r.id) ?? []).length,
    }))
    .sort((a, b) => b.votes - a.votes);
}

export type AttendedScreeningRow = ScreeningRow & { userScore: number | null; userComment: string | null };

export async function getAttendedScreeningsForUser(userId: number): Promise<AttendedScreeningRow[]> {
  const db = getDb();

  const rows = await db
    .select({
      id: screenings.id,
      movieId: screenings.movieId,
      scheduledDate: screenings.scheduledDate,
      hour: screenings.hour,
      status: screenings.status,
      snack: screenings.snack,
      location: screenings.location,
      curatedBy: screenings.curatedBy,
      notes: screenings.notes,
      title: movies.title,
      year: movies.year,
      director: movies.director,
      genre: movies.genre,
      posterHue: movies.posterHue,
      posterPath: movies.posterPath,
      duration: movies.duration,
      synopsis: movies.synopsis,
    })
    .from(screenings)
    .innerJoin(attendances, and(eq(screenings.id, attendances.screeningId), eq(attendances.userId, userId)))
    .leftJoin(movies, eq(screenings.movieId, movies.id))
    .orderBy(desc(screenings.scheduledDate));

  const withAvgScores = await attachAvgScores(rows);

  const userScoreRows = await db
    .select({ screeningId: scores.screeningId, score: scores.score, comment: scores.comment })
    .from(scores)
    .where(eq(scores.userId, userId));

  const scoreMap = new Map(userScoreRows.map((s) => [s.screeningId, { score: s.score, comment: s.comment }]));

  return withAvgScores.map((r) => ({
    ...r,
    userScore: scoreMap.get(r.id)?.score ?? null,
    userComment: scoreMap.get(r.id)?.comment ?? null,
  }));
}
