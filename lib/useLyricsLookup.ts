import type { LyricsLookupResult, SongSearchResult } from '@/types';

const BASE = 'https://lrclib.net/api';

type LrclibTrack = {
  plainLyrics?: string | null;
  syncedLyrics?: string | null;
  instrumental?: boolean;
};

const MANUAL_FALLBACK: LyricsLookupResult = { plainLyrics: null, syncedLyrics: null, source: 'manual' };

export async function lookupLyricsForTrack(
  track: SongSearchResult,
  signal?: AbortSignal
): Promise<LyricsLookupResult> {
  try {
    let result: LrclibTrack | null = null;

    // Step 1: get-cached
    const cachedParams = new URLSearchParams({
      track_name: track.title,
      artist_name: track.artist,
      album_name: track.album,
      duration: String(Math.round(track.durationMs / 1000)),
    });

    const cachedRes = await fetch(`${BASE}/get-cached?${cachedParams}`, { signal });

    if (cachedRes.ok) {
      const data = (await cachedRes.json()) as LrclibTrack;
      if (data.plainLyrics) result = data;
    }

    // Step 2: fallback search if no result yet
    if (!result) {
      const searchParams = new URLSearchParams({
        track_name: track.title,
        artist_name: track.artist,
      });

      const searchRes = await fetch(`${BASE}/search?${searchParams}`, { signal });

      if (searchRes.ok) {
        const hits = (await searchRes.json()) as LrclibTrack[];
        if (Array.isArray(hits) && hits.length > 0) result = hits[0];
      }
    }

    if (!result) return MANUAL_FALLBACK;

    // Step 3: instrumental tracks have no singable lyrics
    if (result.instrumental) return MANUAL_FALLBACK;

    // Step 4: return what we have
    return {
      plainLyrics: result.plainLyrics ?? null,
      syncedLyrics: result.syncedLyrics ?? null,
      source: 'lrclib',
    };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') throw err;
    return MANUAL_FALLBACK;
  }
}
