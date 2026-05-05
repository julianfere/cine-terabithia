export const dynamic = 'force-dynamic';
import VotacionClient from './VotacionClient';
import { getUpcomingScreening } from '@/lib/data';
import { getDb } from '@/db';
import { screeningVotes, recommendations } from '@/db/schema';
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
  const [votes, allRecs] = await Promise.all([
    db.select().from(screeningVotes).where(eq(screeningVotes.screeningId, upcoming.id)),
    db.select().from(recommendations),
  ]);

  const candidates = allRecs.map((r) => ({
    ...r,
    voters: votes.filter((v) => v.recommendationId === r.id).map((v) => v.username),
    totalVotos: votes.filter((v) => v.recommendationId === r.id).length,
  })).sort((a, b) => b.totalVotos - a.totalVotos);

  return <VotacionClient screening={upcoming} candidates={candidates} username={username} />;
}
