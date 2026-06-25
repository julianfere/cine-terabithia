export const dynamic = 'force-dynamic';
export const metadata = { title: 'Trivia — Cine Terabithia' };

import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getDb } from '@/db';
import { triviaGames } from '@/db/schema';
import { desc, inArray } from 'drizzle-orm';
import Link from 'next/link';

export default async function TriviaListPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const db = getDb();
  const activeGames = await db
    .select()
    .from(triviaGames)
    .where(inArray(triviaGames.status, ['lobby', 'active']))
    .orderBy(desc(triviaGames.createdAt));

  const finishedGames = await db
    .select()
    .from(triviaGames)
    .where(inArray(triviaGames.status, ['finished']))
    .orderBy(desc(triviaGames.createdAt))
    .limit(5);

  return (
    <div className="shell" style={{ paddingTop: 40 }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 6px' }}>Trivia</h1>
        <p style={{ color: 'var(--ink-mute)', margin: '0 0 32px', fontSize: 15 }}>
          Preguntas sobre las películas del club
        </p>

        {activeGames.length === 0 && (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius-lg)',
            padding: '40px 24px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎬</div>
            <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>No hay trivia activa</div>
            <div style={{ color: 'var(--ink-mute)', fontSize: 14 }}>
              Cuando el admin lance un juego, aparecerá acá.
            </div>
          </div>
        )}

        {activeGames.map((game) => (
          <Link
            key={game.id}
            href={`/trivia/${game.id}`}
            style={{
              display: 'block',
              background: 'var(--bg-card)',
              border: '1px solid var(--accent)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 24px',
              marginBottom: 12,
              textDecoration: 'none',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{game.name}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {game.status === 'lobby' ? '⏳ Esperando inicio' : '🔴 En juego'}
                </div>
              </div>
              <div style={{
                background: game.status === 'active' ? 'var(--accent)' : 'var(--bg-hover)',
                color: game.status === 'active' ? 'var(--bg)' : 'var(--ink)',
                borderRadius: 'var(--radius)',
                padding: '8px 16px',
                fontWeight: 700,
                fontSize: 14,
                whiteSpace: 'nowrap',
              }}>
                {game.status === 'lobby' ? 'Entrar al lobby' : 'Jugar →'}
              </div>
            </div>
          </Link>
        ))}

        {finishedGames.length > 0 && (
          <div style={{ marginTop: 40 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
              Trivia anteriores
            </div>
            {finishedGames.map((game) => (
              <Link
                key={game.id}
                href={`/trivia/${game.id}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                  background: 'var(--bg-elev)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius)',
                  padding: '14px 18px',
                  marginBottom: 8,
                  textDecoration: 'none',
                  color: 'var(--ink-soft)',
                }}
              >
                <span style={{ fontWeight: 600, fontSize: 15 }}>{game.name}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)' }}>Ver resultados</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
