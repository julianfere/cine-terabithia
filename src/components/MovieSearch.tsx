'use client';
import { useState, useEffect, useRef } from 'react';

export type MovieDetails = {
  tmdbId: number;
  title: string;
  year: number | null;
  director: string | null;
  genre: string | null;
  duration: number | null;
  posterPath: string | null;
  synopsis: string | null;
};

type SearchResult = { tmdbId: number; title: string; year: number | null; posterPath: string | null };

export default function MovieSearch({ onSelect, placeholder = 'Buscar película…' }: { onSelect: (m: MovieDetails) => void; placeholder?: string }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [fetching, setFetching] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return; }
    const timer = setTimeout(async () => {
      setFetching(true);
      try {
        const res = await fetch(`/api/movies/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
        setOpen(data.length > 0);
      } finally {
        setFetching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = async (r: SearchResult) => {
    setOpen(false);
    setQuery(r.title);
    const res = await fetch(`/api/movies/${r.tmdbId}`);
    if (res.ok) {
      onSelect(await res.json());
    } else {
      onSelect({ tmdbId: r.tmdbId, title: r.title, year: r.year, director: null, genre: null, duration: null, posterPath: r.posterPath, synopsis: null });
    }
  };

  return (
    <div ref={ref} style={{ position: 'relative', marginBottom: 20 }}>
      <label className="eyebrow" style={{ display: 'block', marginBottom: 6 }}>Buscar en TMDB</label>
      <div style={{ position: 'relative' }}>
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg)', border: '1px solid var(--accent)', borderRadius: 'var(--radius-sm)', padding: '10px 36px 10px 12px', fontSize: 14, color: 'var(--ink)', outline: 'none' }}
        />
        <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: fetching ? 'var(--ink-mute)' : 'var(--accent)', fontSize: 16, pointerEvents: 'none' }}>
          {fetching ? '…' : '⌕'}
        </span>
      </div>

      {open && results.length > 0 && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 200, background: 'var(--bg-card)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
          {results.map((r, i) => (
            <div
              key={r.tmdbId}
              onClick={() => handleSelect(r)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', cursor: 'pointer', borderBottom: i < results.length - 1 ? '1px solid var(--line)' : 'none', transition: 'background 0.1s' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '')}
            >
              {r.posterPath ? (
                <img
                  src={`https://image.tmdb.org/t/p/w92${r.posterPath}`}
                  alt=""
                  style={{ width: 30, height: 44, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }}
                />
              ) : (
                <div style={{ width: 30, height: 44, background: 'var(--bg-elev)', borderRadius: 3, flexShrink: 0 }} />
              )}
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}>{r.title}</div>
                {r.year && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)', marginTop: 2 }}>{r.year}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
