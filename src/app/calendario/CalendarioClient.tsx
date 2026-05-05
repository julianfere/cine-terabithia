'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { ScreeningRow } from '@/lib/data';
import { Poster } from '@/components/Poster';
import { Stars, StarMini } from '@/components/Stars';
import { SectionHeader } from '@/components/SectionHeader';
import { Avatar } from '@/components/Avatar';
import { useProfiles, resolveUser } from '@/lib/useProfiles';

function formatMonthDay(d: string) {
  const date = new Date(d + 'T00:00:00');
  const mes = date.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '');
  return { mes, dia: date.getDate() };
}

export default function CalendarioClient({ screenings }: { screenings: ScreeningRow[] }) {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('recent');
  const [filter, setFilter] = useState<'all' | 'past' | 'upcoming'>('all');

  const sorted = useMemo(() => {
    let list = [...screenings];
    if (filter !== 'all') list = list.filter((s) => s.status === filter);
    if (sortBy === 'rating') list.sort((a, b) => (b.avgScore ?? 0) - (a.avgScore ?? 0));
    else if (sortBy === 'attendance') list.sort((a, b) => b.scoreCount - a.scoreCount);
    else list.sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate));
    return list;
  }, [screenings, sortBy, filter]);

  const profiles = useProfiles();
  const past = screenings.filter((s) => s.status === 'past');
  const upcoming = screenings.filter((s) => s.status === 'upcoming');

  return (
    <div className="page-enter shell" style={{ paddingTop: 32 }}>
      <SectionHeader
        eyebrow={`${past.length} funciones · ${upcoming.length} próximas`}
        title={<>Funciones <em>proyectadas</em></>}
        action={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="eyebrow">Ordenar</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="btn btn-sm btn-ghost"
              style={{ background: 'var(--bg-elev)', cursor: 'pointer' }}
            >
              <option value="recent">Más recientes</option>
              <option value="rating">Mejor puntaje</option>
              <option value="attendance">Más votos</option>
            </select>
            <span style={{ width: 1, height: 22, background: 'var(--line)' }} />
            {(['all','past','upcoming'] as const).map((k) => (
              <button key={k} className={`chip${filter === k ? ' active' : ''}`} onClick={() => setFilter(k)}>
                {k === 'all' ? 'Todas' : k === 'past' ? 'Pasadas' : 'Próximas'}
              </button>
            ))}
            <span style={{ width: 1, height: 22, background: 'var(--line)' }} />
            <button className={`chip${view === 'grid' ? ' active' : ''}`} onClick={() => setView('grid')}>Grid</button>
            <button className={`chip${view === 'list' ? ' active' : ''}`} onClick={() => setView('list')}>Lista</button>
          </div>
        }
      />

      {sorted.length === 0 && (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Sin resultados</div>
          <p style={{ color: 'var(--ink-mute)', margin: 0 }}>
            {filter === 'past' ? 'Todavía no hay funciones pasadas.' : filter === 'upcoming' ? 'No hay funciones próximas programadas.' : 'No hay funciones registradas aún.'}
          </p>
        </div>
      )}

      {view === 'grid' && sorted.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 24 }}>
          {sorted.map((f) => {
            const { mes, dia } = formatMonthDay(f.scheduledDate);
            return (
              <Link key={f.id} href={`/funciones/${f.id}`} className="poster-link">
                <div style={{ position: 'relative' }}>
                  <Poster label={f.title ? f.title.toUpperCase() : 'POR VOTAR'} hue={f.posterHue ?? 120} posterPath={f.posterPath} />
                  <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', padding: '3px 7px', borderRadius: 3, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', color: 'var(--ink)' }}>
                    {mes.toUpperCase()} {dia}
                  </div>
                  {f.avgScore != null && (
                    <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'var(--accent)', color: 'var(--bg)', padding: '3px 8px', borderRadius: 3, fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <StarMini size={10} color="var(--bg)" /> {f.avgScore.toFixed(1)}
                    </div>
                  )}
                  {f.status === 'upcoming' && (
                    <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'var(--accent)', color: 'var(--bg)', padding: '3px 8px', borderRadius: 3, fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em' }}>
                      PRÓXIMA
                    </div>
                  )}
                </div>
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, lineHeight: 1.2, marginBottom: 2 }}>
                    {f.title ?? <span style={{ color: 'var(--ink-mute)', fontStyle: 'italic', fontWeight: 400 }}>Por votar</span>}
                    {f.title && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 400, color: 'var(--ink-mute)', marginLeft: 6 }}>
                        &apos;{f.year ? String(f.year).slice(2) : '??'}
                      </span>
                    )}
                  </div>
                  {f.curatedBy && (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Avatar {...resolveUser(profiles, f.curatedBy)} size="sm" />
                      <span>{resolveUser(profiles, f.curatedBy).name.toLowerCase()}</span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ) : sorted.length > 0 ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {sorted.map((f, i) => {
            const { mes, dia } = formatMonthDay(f.scheduledDate);
            return (
              <Link
                key={f.id}
                href={`/funciones/${f.id}`}
                style={{
                  padding: '14px 20px', display: 'grid',
                  gridTemplateColumns: '50px 50px 1fr 140px 100px 120px', gap: 16,
                  alignItems: 'center', cursor: 'pointer',
                  borderBottom: i === sorted.length - 1 ? 'none' : '1px solid var(--line)',
                  transition: 'background 0.15s ease', color: 'inherit',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '')}
              >
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', textAlign: 'center' }}>
                  <div style={{ color: 'var(--accent)', fontWeight: 600 }}>{mes}</div>
                  <div style={{ fontSize: 16, color: 'var(--ink)', fontWeight: 700 }}>{dia}</div>
                </div>
                <div style={{ width: 50 }}>
                  <Poster label={f.title ? f.title.toUpperCase().slice(0, 8) : 'VOTAR'} hue={f.posterHue ?? 120} posterPath={f.posterPath} />
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 18, lineHeight: 1.1 }}>
                    {f.title ? (
                      <>
                        {f.title}
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 400, color: 'var(--ink-mute)', marginLeft: 8 }}>
                          &apos;{f.year ? String(f.year).slice(2) : '??'}
                        </span>
                      </>
                    ) : (
                      <span style={{ color: 'var(--ink-mute)', fontStyle: 'italic', fontWeight: 400, fontSize: 15 }}>Votación abierta</span>
                    )}
                  </div>
                  {f.title && (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>
                      dir. {f.director} · {f.genre}
                    </div>
                  )}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)' }}>
                  {f.location}
                </div>
                {f.curatedBy && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar {...resolveUser(profiles, f.curatedBy)} size="sm" />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)' }}>{resolveUser(profiles, f.curatedBy).name.toLowerCase()}</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                  {f.avgScore != null ? (
                    <>
                      <Stars value={Math.round(f.avgScore)} />
                      <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 16, color: 'var(--accent)' }}>{f.avgScore.toFixed(1)}</span>
                    </>
                  ) : (
                    <span className="badge">próxima</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
