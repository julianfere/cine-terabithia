export const dynamic = 'force-dynamic';
import VotacionClient from './VotacionClient';
import { getUpcomingScreening } from '@/lib/data';
import { getDb } from '@/db';
import { screeningVotes, recommendations, movies, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';

export default async function Votacion() {
  const upcoming = await getUpcomingScreening();
  if (!upcoming) {
    return (
      <div className="page-enter shell" style={{ paddingTop: 64, textAlign: 'center' }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>Sin votación activa</div>
        <p style={{ color: 'var(--ink-mute)', fontSize: 16 }}>No hay ninguna función próxima programada.</p>
      </div>
    );
  }

  const session = await auth();
  const username = session?.user?.name ?? null;

  if (upcoming.title) {
    return <VotacionClient screening={upcoming} candidates={[]} username={username} movieAssigned />;
  }

  const db = getDb();
  const [votes, allRecs, userRows] = await Promise.all([
    db.select({
      id: screeningVotes.id,
      screeningId: screeningVotes.screeningId,
      recommendationId: screeningVotes.recommendationId,
      userId: screeningVotes.userId,
      username: users.username,
    })
      .from(screeningVotes)
      .innerJoin(users, eq(screeningVotes.userId, users.id))
      .where(eq(screeningVotes.screeningId, upcoming.id)),

    db.select({
      id: recommendations.id,
      movieId: recommendations.movieId,
      suggestedById: recommendations.suggestedById,
      reason: recommendations.reason,
      featured: recommendations.featured,
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
      .leftJoin(movies, eq(recommendations.movieId, movies.id)),

    db.select({ id: users.id, username: users.username }).from(users),
  ]);

  const userMap = new Map(userRows.map((u) => [u.id, u.username]));

  const candidates = allRecs.map((r) => ({
    ...r,
    title: r.title ?? '',
    suggestedBy: userMap.get(r.suggestedById) ?? '',
    voters: votes.filter((v) => v.recommendationId === r.id).map((v) => v.username),
    totalVotos: votes.filter((v) => v.recommendationId === r.id).length,
  })).sort((a, b) => b.totalVotos - a.totalVotos);

  return <VotacionClient screening={upcoming} candidates={candidates} username={username} />;
}
