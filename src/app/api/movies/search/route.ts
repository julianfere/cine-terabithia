import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q');
  if (!q) return NextResponse.json([]);

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return NextResponse.json([]);

  const res = await fetch(
    `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(q)}&language=es-AR`,
    { next: { revalidate: 0 } }
  );
  const data = await res.json();

  return NextResponse.json(
    (data.results || []).slice(0, 6).map((m: {
      id: number; title: string; release_date?: string;
      poster_path?: string; overview?: string;
    }) => ({
      tmdbId: m.id,
      title: m.title,
      year: m.release_date ? Number(m.release_date.slice(0, 4)) : null,
      posterPath: m.poster_path || null,
      synopsis: m.overview || null,
    }))
  );
}
