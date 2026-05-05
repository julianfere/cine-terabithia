import { getDb } from '@/db';
import { movies, screenings, scores, recommendations, recommendationVotes, users } from '@/db/schema';
import { eq, desc, avg, count, asc } from 'drizzle-orm';
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

function attachAvgScores(rows: Omit<ScreeningRow, 'avgScore' | 'scoreCount'>[]): ScreeningRow[] {
  const db = getDb();
  const avgScores = db
    .select({ screeningId: scores.screeningId, avg: avg(scores.score), cnt: count(scores.id) })
    .from(scores)
    .groupBy(scores.screeningId)
    .all();
  const map = new Map(avgScores.map((s) => [s.screeningId, { avg: Number(s.avg || 0), cnt: s.cnt }]));
  return rows.map((r) => ({
    ...r,
    avgScore: map.get(r.id)?.avg ?? null,
    scoreCount: map.get(r.id)?.cnt ?? 0,
  }));
}

export function getUpcomingScreening(): ScreeningRow | null {
  const row = buildScreeningQuery()
    .where(eq(screenings.status, 'upcoming'))
    .orderBy(asc(screenings.scheduledDate))
    .get();
  if (!row) return null;
  return attachAvgScores([row])[0];
}

export function getPastScreenings(): ScreeningRow[] {
  const rows = buildScreeningQuery()
    .where(eq(screenings.status, 'past'))
    .orderBy(desc(screenings.scheduledDate))
    .all();
  return attachAvgScores(rows);
}

export function getAllScreenings(): ScreeningRow[] {
  const rows = buildScreeningQuery()
    .orderBy(desc(screenings.scheduledDate))
    .all();
  return attachAvgScores(rows);
}

export function getScreeningById(id: number): ScreeningRow | null {
  const row = buildScreeningQuery()
    .where(eq(screenings.id, id))
    .get();
  if (!row) return null;
  return attachAvgScores([row])[0];
}

export function getScoresForScreening(screeningId: number) {
  const db = getDb();
  return db.select().from(scores).where(eq(scores.screeningId, screeningId)).orderBy(desc(scores.score)).all();
}

export function getUserProfiles(): ProfilesMap {
  const db = getDb();
  const rows = db.select({ username: users.username, displayName: users.displayName, avatar: users.avatar }).from(users).all();
  const map: ProfilesMap = {};
  for (const u of rows) map[u.username] = { displayName: u.displayName ?? null, avatar: u.avatar ?? null };
  return map;
}

export function getRecommendations(): RecommendationRow[] {
  const db = getDb();
  const rows = db.select().from(recommendations).all();
  const voteCounts = db
    .select({ recId: recommendationVotes.recommendationId, cnt: count(recommendationVotes.id) })
    .from(recommendationVotes)
    .groupBy(recommendationVotes.recommendationId)
    .all();
  const voteMap = new Map(voteCounts.map((v) => [v.recId, v.cnt]));
  return rows
    .map((r) => ({ ...r, votes: voteMap.get(r.id) ?? 0 }))
    .sort((a, b) => b.votes - a.votes) as RecommendationRow[];
}
