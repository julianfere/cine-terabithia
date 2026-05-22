export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { getUpcomingScreening, getPastScreenings, getRecommendations, getUserProfiles } from '@/lib/data';
import { resolveUser } from '@/lib/profiles';
import { Poster } from '@/components/Poster';
import { Stars, StarMini } from '@/components/Stars';
import { Badge } from '@/components/Badge';
import { SectionHeader } from '@/components/SectionHeader';
import { Avatar } from '@/components/Avatar';
import { getDb } from '@/db';
import { screenings, scores } from '@/db/schema';
import { count, eq } from 'drizzle-orm';

function formatDate(d: string) {
  const date = new Date(d + 'T00:00:00');
  return date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function formatMonthDay(d: string) {
  const date = new Date(d + 'T00:00:00');
  const mes = date.toLocaleDateString('es-AR', { month: 'short' });
  const dia = date.getDate();
  return { mes: mes.replace('.', ''), dia };
}

export default async function Home() {
  const [upcoming, past, recs, profiles] = await Promise.all([
    getUpcomingScreening(),
    getPastScreenings(),
    getRecommendations(),
    getUserProfiles(),
  ]);

  const topRec = recs[0] ?? null;

  const db = getDb();
  const [funcionesResult, scoresResult] = await Promise.all([
    db.select({ cnt: count(screenings.id) }).from(screenings).where(eq(screenings.status, 'past')),
    db.select({ cnt: count(scores.id) }).from(scores),
  ]);
  const totalFunciones = Number(funcionesResult[0]?.cnt ?? 0);
  const totalScores = Number(scoresResult[0]?.cnt ?? 0);

  const ultima = past[0] ?? null;
  const recentGrid = past.slice(1, 8);

  const isEmpty = !upcoming && past.length === 0;

  return (
    <div className="page-enter shell" style={{ paddingTop: 32 }}>

      {/* EMPTY STATE */}
      {isEmpty && (
        <div style={{ paddingTop: 64, paddingBottom: 64, textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 24, opacity: 0.15 }}>🎬</div>
          <div className="eyebrow" style={{ marginBottom: 12 }}>El club está arrancando</div>
          <h1 className="h-display" style={{ fontSize: 'clamp(40px, 6vw, 72px)', margin: '0 0 16px', textTransform: 'uppercase' }}>
            Cine <em>Terabithia</em>
          </h1>
          <p style={{ color: 'var(--ink-mute)', fontSize: 16, maxWidth: 400, margin: '0 auto 36px' }}>
            Todavía no hay funciones programadas. El admin puede crear la primera desde el panel.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/watchlist" className="btn btn-primary">Ver sugeridos →</a>
            <a href="/votacion" className="btn btn-ghost">Votar próxima película</a>
          </div>
        </div>
      )}

      {/* HERO — Próxima función sin película (votación abierta) */}
      {upcoming && !upcoming.title && (
        <section style={{ paddingBottom: 48 }}>
          <div style={{ background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '40px 36px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--accent)' }} />
            <Badge kind="live accent">Votación abierta</Badge>
            <h1 className="h-display" style={{ fontSize: 'clamp(44px, 6vw, 80px)', margin: '16px 0 8px', textTransform: 'uppercase' }}>
              ¿Qué vemos <em>próximo</em>?
            </h1>
            <p style={{ color: 'var(--ink-soft)', fontSize: 16, margin: '0 0 24px', maxWidth: 500 }}>
              La película para {formatDate(upcoming.scheduledDate)} todavía se está votando.
            </p>
            <Link href="/votacion" className="btn btn-primary">Ver candidatas y votar →</Link>
          </div>
        </section>
      )}

      {/* HERO — Próxima función con película */}
      {upcoming && upcoming.title && (
        <section style={{ paddingBottom: 48 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 280px', gap: 36, alignItems: 'start' }} className="hero-grid">
            <div>
              <Poster
                label={(upcoming.title ?? '').toUpperCase()}
                hue={upcoming.posterHue ?? 200}
                posterPath={upcoming.posterPath}
              />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
                <Badge kind="live accent">Próxima función</Badge>
                <span className="eyebrow">· {formatDate(upcoming.scheduledDate)} · {upcoming.hour ?? ''}</span>
              </div>

              <h1 className="h-display" style={{ fontSize: 'clamp(56px, 7vw, 88px)', margin: '0 0 8px', textTransform: 'uppercase' }}>
                {upcoming.title}
                {upcoming.year && (
                  <span style={{ fontSize: 'clamp(20px, 2vw, 26px)', fontWeight: 400, color: 'var(--ink-mute)', letterSpacing: '0.02em', marginLeft: 12, fontFamily: 'var(--font-mono)', textTransform: 'none' }}>
                    &apos;{String(upcoming.year).slice(2)}
                  </span>
                )}
              </h1>

              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>
                {upcoming.director && `dir. ${upcoming.director}`}{upcoming.duration ? ` · ${upcoming.duration} min` : ''}{upcoming.genre ? ` · ${upcoming.genre}` : ''}
              </div>

              {upcoming.synopsis && (
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 17, lineHeight: 1.5, color: 'var(--ink-soft)', maxWidth: 560, margin: '0 0 28px' }}>
                  {upcoming.synopsis}
                </p>
              )}

              {/* Meta strip */}
              <div style={{ display: 'flex', flexWrap: 'wrap', border: '1px solid var(--line)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                <div style={{ flex: 1, padding: '12px 16px', borderRight: '1px solid var(--line)', minWidth: 120 }}>
                  <div className="eyebrow" style={{ marginBottom: 4 }}>Cuándo</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>
                    {new Date(upcoming.scheduledDate + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                    {upcoming.hour && <span style={{ display: 'block', color: 'var(--ink-mute)', fontSize: 11 }}>{upcoming.hour}</span>}
                  </div>
                </div>
                {upcoming.location && (
                  <div style={{ flex: 1, padding: '12px 16px', borderRight: '1px solid var(--line)', minWidth: 120 }}>
                    <div className="eyebrow" style={{ marginBottom: 4 }}>Lugar</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>{upcoming.location}</div>
                  </div>
                )}
                {upcoming.snack && (
                  <div style={{ flex: 1, padding: '12px 16px', borderRight: '1px solid var(--line)', minWidth: 120 }}>
                    <div className="eyebrow" style={{ marginBottom: 4 }}>Snack</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>{upcoming.snack}</div>
                  </div>
                )}
                {upcoming.curatedBy && (
                  <div style={{ flex: 1, padding: '12px 16px', minWidth: 120 }}>
                    <div className="eyebrow" style={{ marginBottom: 4 }}>Curador</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Avatar {...resolveUser(profiles, upcoming.curatedBy)} size="sm" />
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{resolveUser(profiles, upcoming.curatedBy).name}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right rail */}
            <aside style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {!upcoming?.title && (
                <div className="card" style={{ padding: 16, borderLeft: '3px solid var(--accent)' }}>
                  <div className="eyebrow" style={{ marginBottom: 12 }}>Votación abierta</div>
                  <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '0 0 14px' }}>Elegí la próxima película</p>
                  <Link href="/votacion" className="btn btn-primary btn-sm" style={{ display: 'flex', justifyContent: 'center' }}>
                    Votar ahora →
                  </Link>
                </div>
              )}

              <div className="card" style={{ padding: 16 }}>
                <div className="eyebrow" style={{ marginBottom: 12 }}>Stats del club</div>
                {[
                  ['Funciones', totalFunciones],
                  ['Puntajes registrados', totalScores],
                  ['Sugeridos', recs.length],
                ].map(([label, value]) => (
                  <div key={String(label)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '6px 0', borderBottom: '1px dashed var(--line)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)' }}>{label}</span>
                    <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 18, color: 'var(--accent)' }}>{value}</span>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>
      )}

      {/* ÚLTIMA FUNCIÓN */}
      {ultima && (
        <section style={{ marginBottom: 56 }}>
          <SectionHeader
            eyebrow={`★ ${ultima.avgScore?.toFixed(1) ?? '—'} promedio · ${ultima.scoreCount} votos`}
            title={<>Última <em>función</em></>}
            action={
              <Link href="/calendario" className="btn btn-ghost btn-sm">
                Ver todas →
              </Link>
            }
          />
          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 28 }} className="last-grid">
            <Link href={`/funciones/${ultima.id}`} className="poster-link">
              <Poster label={(ultima.title ?? '').toUpperCase()} hue={ultima.posterHue ?? 200} posterPath={ultima.posterPath} />
            </Link>
            <div>
              <h3 className="h-display" style={{ fontSize: 44, margin: '0 0 6px', textTransform: 'uppercase' }}>
                {ultima.title}
                {ultima.year && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 400, color: 'var(--ink-mute)', marginLeft: 10, letterSpacing: '0.02em', textTransform: 'none' }}>
                    &apos;{String(ultima.year).slice(2)}
                  </span>
                )}
              </h3>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 18 }}>
                dir. {ultima.director} · {ultima.genre}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                <Stars value={Math.round(ultima.avgScore ?? 0)} size="lg" />
                <span className="h-display" style={{ fontSize: 32, color: 'var(--accent)' }}>
                  {ultima.avgScore?.toFixed(1) ?? '—'}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)' }}>
                  {ultima.scoreCount} votos
                </span>
              </div>
              <div style={{ marginTop: 20 }}>
                <Link href={`/funciones/${ultima.id}`} className="btn btn-sm">Ver detalle</Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* RECENT GRID */}
      {recentGrid.length > 0 && (
        <section style={{ marginBottom: 56 }}>
          <SectionHeader eyebrow="Archivo del club" title={<>Funciones <em>recientes</em></>} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 16 }} className="recent-grid">
            {recentGrid.map((f) => {
              const { mes, dia } = formatMonthDay(f.scheduledDate);
              return (
                <Link key={f.id} href={`/funciones/${f.id}`} className="poster-link">
                  <div style={{ position: 'relative' }}>
                    <Poster label={(f.title ?? '').toUpperCase()} hue={f.posterHue ?? 200} posterPath={f.posterPath} />
                    <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', padding: '3px 7px', borderRadius: 3, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', color: 'var(--ink)' }}>
                      {mes.toUpperCase()} {dia}
                    </div>
                    {f.avgScore && (
                      <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'var(--accent)', color: 'var(--bg)', padding: '3px 8px', borderRadius: 3, fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <StarMini size={10} color="var(--bg)" /> {f.avgScore.toFixed(1)}
                      </div>
                    )}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600, lineHeight: 1.2 }}>{f.title}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', marginTop: 2 }}>
                    {f.year}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* TOP REC */}
      {topRec && (
        <section>
          <SectionHeader
            eyebrow={`${recs.length} sugeridos`}
            title={<>Películas <em>sugeridas</em></>}
            action={
              <Link href="/watchlist" className="btn btn-ghost btn-sm">
                Ver toda la cola →
              </Link>
            }
          />
          <div className="card top-rec-card" style={{ padding: 24 }}>
            <Poster label={(topRec.title ?? '').toUpperCase()} hue={topRec.posterHue ?? 200} posterPath={topRec.posterPath} />
            <div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <Badge kind="accent">↑ {topRec.votes} votos</Badge>
                {topRec.featured ? <Badge>Destacada por admin</Badge> : null}
              </div>
              <h3 className="h-display" style={{ fontSize: 32, margin: '0 0 4px', textTransform: 'uppercase' }}>{topRec.title}</h3>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                {topRec.director} · {topRec.year} · {topRec.duration} min
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14, color: 'var(--ink-soft)' }}>
                <Avatar {...resolveUser(profiles, topRec.suggestedBy)} size="sm" />
                {topRec.reason && <span style={{ fontStyle: 'italic' }}>&quot;{topRec.reason}&quot;</span>}
              </div>
            </div>
            <Link href="/watchlist" className="btn btn-primary top-rec-card-action">↑ Sumar voto</Link>
          </div>
        </section>
      )}

      <style>{`
        @media (max-width: 1100px) {
          .recent-grid { grid-template-columns: repeat(4, 1fr) !important; }
        }
        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .last-grid { grid-template-columns: 120px 1fr !important; }
          .recent-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (max-width: 600px) {
          .last-grid { grid-template-columns: 1fr !important; }
          .recent-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .hero-grid .h-display { font-size: clamp(40px, 10vw, 64px) !important; }
        }
      `}</style>
    </div>
  );
}
