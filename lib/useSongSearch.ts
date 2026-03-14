import { getLocales } from 'expo-localization';
import { Platform } from 'react-native';
import { useEffect, useRef, useState } from 'react';

import type { SongSearchResult } from '@/types';

type ItunesTrack = {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName: string;
  artworkUrl100: string;
  previewUrl?: string;
  trackTimeMillis: number;
  trackViewUrl?: string;
};

type UseSongSearchResult = {
  query: string;
  setQuery: (q: string) => void;
  results: SongSearchResult[];
  isLoading: boolean;
  error: string | null;
};

function getItunesSearchUrl(params: URLSearchParams): string {
  if (Platform.OS === 'web') {
    // Local dev proxy avoids CORS. Run: node scripts/dev-proxy.js
    return `http://localhost:8787?${params.toString()}`;
  }
  return `https://itunes.apple.com/search?${params.toString()}`;
}

export function useSongSearch(): UseSongSearchResult {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SongSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      abortRef.current?.abort();
      setResults([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      setError(null);

      try {
        const country = getLocales()[0]?.regionCode ?? 'US';
        const params = new URLSearchParams({
          term: query.trim(),
          entity: 'song',
          media: 'music',
          limit: '10',
          country,
        });

        const res = await fetch(getItunesSearchUrl(params), { signal: controller.signal });

        const data = (await res.json()) as { results: ItunesTrack[] };

        const mapped: SongSearchResult[] = (data.results ?? []).map((t) => ({
          id: t.trackId,
          title: t.trackName,
          artist: t.artistName,
          album: t.collectionName,
          artworkUrl: t.artworkUrl100,
          previewUrl: t.previewUrl ?? null,
          durationMs: t.trackTimeMillis,
          appleMusicUrl: t.trackViewUrl ?? null,
        }));

        setResults(mapped);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError('Could not reach iTunes. Check your connection.');
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Cancel in-flight request on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return { query, setQuery, results, isLoading, error };
}
