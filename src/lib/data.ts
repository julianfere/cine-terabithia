import { getDb } from '@/db';
import { movies, screenings, scores, recommendations, recommendationVotes, attendances, users } from '@/db/schema';
import { eq, desc, avg, count, asc, and } from 'drizzle-orm';
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
  title: string;
  year: number | null;
  director: string | null;
  genre: string | null;
  duration: number | null;
  posterHue: number | null;
  posterPath: string | null;
  suggestedBy: string;
  reason: string | null;
  featured: number | null;
  votes: number;
  tmdbId: number | null;
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
  const db = getDb();
  const avgScores = await db
    .select({ screeningId: scores.screeningId, avg: avg(scores.score), cnt: count(scores.id) })
    .from(scores)
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
  const rows = await buildScreeningQuery()
    .orderBy(desc(screenings.scheduledDate));
  return attachAvgScores(rows);
}

export async function getScreeningById(id: number): Promise<ScreeningRow | null> {
  const rows = await buildScreeningQuery()
    .where(eq(screenings.id, id))
    .limit(1);
  if (!rows[0]) return null;
  return (await attachAvgScores([rows[0]]))[0];
}

export async function getScoresForScreening(screeningId: number) {
  const db = getDb();
  return db.select().from(scores).where(eq(scores.screeningId, screeningId)).orderBy(desc(scores.score));
}

export async function getUserProfiles(): Promise<ProfilesMap> {
  const db = getDb();
  const rows = await db.select({ username: users.username, displayName: users.displayName, avatar: users.avatar }).from(users);
  const map: ProfilesMap = {};
  for (const u of rows) map[u.username] = { displayName: u.displayName ?? null, avatar: u.avatar ?? null };
  return map;
}

export async function getAttendanceForScreening(screeningId: number): Promise<{ username: string }[]> {
  const db = getDb();
  return db.select({ username: attendances.username })
    .from(attendances)
    .where(eq(attendances.screeningId, screeningId));
}

export async function getUserRecommendationVotes(username: string): Promise<number[]> {
  const db = getDb();
  const rows = await db
    .select({ id: recommendationVotes.recommendationId })
    .from(recommendationVotes)
    .where(eq(recommendationVotes.username, username));
  return rows.map((r) => r.id).filter((id): id is number => id !== null);
}

export async function getRecommendations(): Promise<RecommendationRow[]> {
  const db = getDb();
  const rows = await db.select().from(recommendations);
  const voteCounts = await db
    .select({ recId: recommendationVotes.recommendationId, cnt: count(recommendationVotes.id) })
    .from(recommendationVotes)
    .groupBy(recommendationVotes.recommendationId);
  const voteMap = new Map(voteCounts.map((v) => [v.recId, Number(v.cnt)]));
  return rows
    .map((r) => ({ ...r, votes: voteMap.get(r.id) ?? 0 }))
    .sort((a, b) => b.votes - a.votes) as RecommendationRow[];
}

export type AttendedScreeningRow = ScreeningRow & { userScore: number | null; userComment: string | null };

export async function getAttendedScreeningsForUser(username: string): Promise<AttendedScreeningRow[]> {
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
    .innerJoin(attendances, and(eq(screenings.id, attendances.screeningId), eq(attendances.username, username)))
    .leftJoin(movies, eq(screenings.movieId, movies.id))
    .orderBy(desc(screenings.scheduledDate));

  const withAvgScores = await attachAvgScores(rows);

  const userScoreRows = await db
    .select({ screeningId: scores.screeningId, score: scores.score, comment: scores.comment })
    .from(scores)
    .where(eq(scores.username, username));

  const scoreMap = new Map(userScoreRows.map((s) => [s.screeningId, { score: s.score, comment: s.comment }]));

  return withAvgScores.map((r) => ({
    ...r,
    userScore: scoreMap.get(r.id)?.score ?? null,
    userComment: scoreMap.get(r.id)?.comment ?? null,
  }));
}
