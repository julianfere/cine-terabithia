import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ tmdbId: string }> }) {
  const { tmdbId } = await params;
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 503 });

  const [resEs, resEn] = await Promise.all([
    fetch(`https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${apiKey}&language=es-AR&append_to_response=credits,videos`, { next: { revalidate: 3600 } }),
    fetch(`https://api.themoviedb.org/3/movie/${tmdbId}/videos?api_key=${apiKey}&language=en-US`, { next: { revalidate: 3600 } }),
  ]);
  if (!resEs.ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const data = await resEs.json();
  const director = (data.credits?.crew ?? []).find((p: { job: string; name: string }) => p.job === 'Director')?.name ?? null;
  const genre = (data.genres ?? []).map((g: { name: string }) => g.name).slice(0, 2).join(' / ') || null;

  type Video = { key: string; site: string; type: string; official: boolean };
  const videosEs: Video[] = data.videos?.results ?? [];
  const videosEn: Video[] = resEn.ok ? ((await resEn.json()).results ?? []) : [];

  const pickTrailer = (vids: Video[]) =>
    vids.find((v) => v.site === 'YouTube' && v.type === 'Trailer' && v.official) ??
    vids.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ??
    vids.find((v) => v.site === 'YouTube') ??
    null;

  const trailer = pickTrailer(videosEn) ?? pickTrailer(videosEs) ?? null;

  return NextResponse.json({
    tmdbId: data.id,
    title: data.title,
    year: data.release_date ? Number(data.release_date.slice(0, 4)) : null,
    director,
    genre,
    duration: data.runtime || null,
    posterPath: data.poster_path || null,
    synopsis: data.overview || null,
    trailerKey: trailer?.key ?? null,
  });
}
