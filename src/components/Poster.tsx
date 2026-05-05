interface PosterProps {
  label: string;
  hue: number;
  posterPath?: string | null;
}

export function Poster({ label, hue, posterPath }: PosterProps) {
  if (posterPath) {
    return (
      <div className="poster" style={{ '--poster-hue': hue } as React.CSSProperties}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://image.tmdb.org/t/p/w342${posterPath}`}
          alt={label}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div className="poster-label" style={{ position: 'relative', zIndex: 1 }}>{label}</div>
      </div>
    );
  }
  return (
    <div className="poster" style={{ '--poster-hue': hue } as React.CSSProperties}>
      <div className="poster-label">{label}</div>
    </div>
  );
}
