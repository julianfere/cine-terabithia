'use client';
import Link from 'next/link';
import type { ScreeningRow } from '@/lib/data';
import { Poster } from '@/components/Poster';
import { Stars } from '@/components/Stars';
import { SectionHeader } from '@/components/SectionHeader';
import { Avatar } from '@/components/Avatar';
import { useProfiles, resolveUser } from '@/lib/useProfiles';

export default function RankingClient({ ranked }: { ranked: ScreeningRow[] }) {
  const profiles = useProfiles();
  const podium = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  if (ranked.length === 0) {
    return (
      <div className="page-enter shell" style={{ paddingTop: 32 }}>
        <SectionHeader
          eyebrow="Hall of Fame · Las mejor puntuadas"
          title={<>Top del <em>club</em></>}
        />
        <div className="card" style={{ padding: 64, textAlign: 'center' }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Todavía no hay historia</div>
          <p style={{ color: 'var(--ink-mute)', margin: '0 0 24px' }}>
            El ranking se arma a medida que el club puntúa las funciones pasadas.
          </p>
          <a href="/calendario" className="btn btn-ghost btn-sm">Ver calendario →</a>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter shell" style={{ paddingTop: 32 }}>
      <SectionHeader
        eyebrow="Hall of Fame · Las mejor puntuadas"
        title={<>Top del <em>club</em></>}
      />

      {/* PODIUM */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 56 }} className="podium">
        {podium.map((f, i) => {
          const isFirst = i === 0;
          return (
            <Link
              key={f.id}
              href={`/funciones/${f.id}`}
              className="card"
              style={{ padding: 20, cursor: 'pointer', position: 'relative', borderLeft: `${isFirst ? 3 : 1}px solid ${isFirst ? 'var(--accent)' : 'var(--line)'}`, color: 'inherit', textDecoration: 'none', display: 'block', transition: 'transform 0.15s ease' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ''; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div className="h-display" style={{ fontSize: 72, color: isFirst ? 'var(--accent)' : 'var(--ink-mute)', lineHeight: 0.85 }}>
                  #{i + 1}
                </div>
                <Stars value={Math.round(f.avgScore ?? 0)} size="lg" />
              </div>
              <div style={{ width: 110, marginBottom: 16 }}>
                <Poster label={(f.title ?? '').toUpperCase()} hue={f.posterHue ?? 200} posterPath={f.posterPath} />
              </div>
              <div style={{ fontWeight: 800, fontSize: 22, lineHeight: 1.05, textTransform: 'uppercase', marginBottom: 4 }}>
                {f.title}
                {f.year && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 400, color: 'var(--ink-mute)', marginLeft: 8, textTransform: 'none' }}>&apos;{String(f.year).slice(2)}</span>}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
                dir. {f.director}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
                <span className="h-display" style={{ fontSize: 36, color: 'var(--accent)', lineHeight: 1 }}>{f.avgScore?.toFixed(1) ?? '—'}</span>
                <div style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)' }}>
                  {f.scoreCount} votos
                </div>
                {f.curatedBy && <Avatar {...resolveUser(profiles, f.curatedBy)} size="sm" />}
              </div>
            </Link>
          );
        })}
      </div>

      {rest.length > 0 && (
        <>
          <SectionHeader title={<>El <em>resto</em></>} eyebrow={`puestos 4 al ${ranked.length}`} />
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '12px 20px', background: 'var(--bg-elev)', borderBottom: '1px solid var(--line)', display: 'grid', gridTemplateColumns: '50px 50px 1fr 100px 120px', gap: 16 }} className="rank-head">
              <div className="eyebrow">#</div>
              <div />
              <div className="eyebrow">Película</div>
              <div className="eyebrow" style={{ textAlign: 'center' }}>Votos</div>
              <div className="eyebrow" style={{ textAlign: 'right' }}>Puntaje</div>
            </div>
            {rest.map((f, idx) => (
              <Link
                key={f.id}
                href={`/funciones/${f.id}`}
                style={{ padding: '14px 20px', display: 'grid', gridTemplateColumns: '50px 50px 1fr 100px 120px', gap: 16, alignItems: 'center', borderBottom: '1px solid var(--line)', cursor: 'pointer', transition: 'background 0.15s ease', color: 'inherit' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-elev)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}
              >
                <div className="h-display" style={{ fontSize: 22, color: 'var(--ink-mute)' }}>{String(idx + 4).padStart(2, '0')}</div>
                <div style={{ width: 50 }}><Poster label={(f.title ?? '').toUpperCase().slice(0, 6)} hue={f.posterHue ?? 200} posterPath={f.posterPath} /></div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.1 }}>
                    {f.title}
                    {f.year && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 400, color: 'var(--ink-mute)', marginLeft: 6 }}>&apos;{String(f.year).slice(2)}</span>}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>
                    dir. {f.director}{f.curatedBy ? ` · curó ${resolveUser(profiles, f.curatedBy).name.toLowerCase()}` : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-soft)' }}>{f.scoreCount}</div>
                <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                  <Stars value={Math.round(f.avgScore ?? 0)} />
                  <span style={{ fontWeight: 800, fontSize: 17, color: 'var(--accent)' }}>{f.avgScore?.toFixed(1) ?? '—'}</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      <style>{`
        @media (max-width: 900px) {
          .podium { grid-template-columns: 1fr !important; }
          .rank-head { grid-template-columns: 40px 50px 1fr 120px !important; }
        }
      `}</style>
    </div>
  );
}
