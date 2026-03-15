import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Palette, withOpacity } from '@/constants/theme';
import { lookupLyricsForTrack } from '@/lib/useLyricsLookup';
import { useSongSearch } from '@/lib/useSongSearch';
import type { SongSearchResult } from '@/types';

export default function SongSearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { query, setQuery, results, isLoading, error } = useSongSearch();
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const handleSelect = async (track: SongSearchResult) => {
    if (loadingId !== null) return;
    setLoadingId(track.id);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const artist = (track.artist ?? '').trim();
    const title = (track.title ?? '').trim();
    const q = [artist, title].filter(Boolean).join(' ');
    // YouTube: use only the first listed artist and strip & to avoid %26 being
    // misinterpreted as a URL parameter separator by native URL handlers
    const ytArtist = artist.split(',')[0].replace(/\s*&\s*/g, ' ').replace(/\s+/g, ' ').trim();
    const ytQuery = [ytArtist, title].filter(Boolean).join(' ');
    const externalLinks = JSON.stringify({
      spotify: {
        uri: `spotify:search:${encodeURIComponent(q)}`,
        url: `https://open.spotify.com/search/${encodeURIComponent(q)}`,
      },
      appleMusic: track.appleMusicUrl ? { url: track.appleMusicUrl } : undefined,
      youtube: { url: `https://www.youtube.com/results?search_query=${encodeURIComponent(ytQuery)}` },
    });

    try {
      const result = await lookupLyricsForTrack(track, controller.signal);

      router.replace({
        pathname: '/song/new',
        params: {
          prefillName: track.title,
          prefillArtist: track.artist,
          prefillLyrics: result.plainLyrics ?? '',
          lyricsSource: result.source,
          prefillSyncedLyrics: result.syncedLyrics ?? '',
          prefillArtworkUrl: track.artworkUrl.replace('100x100bb', '300x300bb'),
          prefillExternalLinks: externalLinks,
        },
      } as Parameters<typeof router.replace>[0]);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      router.replace({
        pathname: '/song/new',
        params: {
          prefillName: track.title,
          prefillArtist: track.artist,
          prefillLyrics: '',
          lyricsSource: 'manual',
          prefillSyncedLyrics: '',
          prefillArtworkUrl: track.artworkUrl.replace('100x100bb', '300x300bb'),
          prefillExternalLinks: externalLinks,
        },
      } as Parameters<typeof router.replace>[0]);
    } finally {
      setLoadingId(null);
    }
  };

  const showEmpty = !isLoading && !error && query.trim().length > 0 && results.length === 0;
  const showError = !!error;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <TextInput
        autoFocus
        onChangeText={setQuery}
        placeholder="Search for a song or artist..."
        placeholderTextColor={Palette.textSecondary}
        returnKeyType="search"
        style={styles.input}
        value={query}
      />

      <Pressable onPress={() => router.replace('/song/new' as Parameters<typeof router.replace>[0])} style={styles.skipRow}>
        <Text style={styles.skipLabel}>Skip / enter manually</Text>
      </Pressable>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Palette.accent} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : null}

      {showEmpty ? (
        <Text style={styles.emptyText}>
          No results for that search. Try different keywords, or skip to enter manually.
        </Text>
      ) : null}

      {showError ? (
        <Text style={styles.errorText}>
          Search is unavailable right now. You can still enter a song manually below.
        </Text>
      ) : null}

      <FlatList
        data={results}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyboardShouldPersistTaps="handled"
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => {
          const isThisLoading = loadingId === item.id;
          return (
            <Pressable
              disabled={loadingId !== null}
              onPress={() => void handleSelect(item)}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
              <Text numberOfLines={1} style={styles.rowTitle}>
                {item.title}
              </Text>
              {isThisLoading ? (
                <Text style={styles.rowFindingLyrics}>Finding lyrics...</Text>
              ) : (
                <Text numberOfLines={1} style={styles.rowSub}>
                  {item.artist} · {item.album}
                </Text>
              )}
            </Pressable>
          );
        }}
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Palette.background,
    flex: 1,
  },
  input: {
    color: Palette.textPrimary,
    fontFamily: 'DM-Sans-SemiBold',
    fontSize: 18,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  skipRow: {
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  skipLabel: {
    color: Palette.accent,
    fontFamily: 'DM-Sans',
    fontSize: 14,
  },
  loadingWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
    paddingHorizontal: 20,
  },
  loadingText: {
    color: Palette.textDisabled,
    fontFamily: 'DM-Sans',
    fontSize: 14,
  },
  emptyText: {
    color: Palette.textSecondary,
    fontFamily: 'DM-Sans',
    fontSize: 14,
    marginTop: 24,
    paddingHorizontal: 20,
    textAlign: 'center',
  },
  errorText: {
    color: withOpacity(Palette.recordRed, 0.85),
    fontFamily: 'DM-Sans',
    fontSize: 14,
    marginTop: 24,
    paddingHorizontal: 20,
    textAlign: 'center',
  },
  list: {
    flex: 1,
    marginTop: 8,
  },
  separator: {
    backgroundColor: Palette.border,
    height: StyleSheet.hairlineWidth,
    marginLeft: 20,
  },
  row: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  rowPressed: {
    backgroundColor: withOpacity(Palette.accent, 0.06),
  },
  rowTitle: {
    color: Palette.textPrimary,
    fontFamily: 'DM-Sans-SemiBold',
    fontSize: 16,
    marginBottom: 3,
  },
  rowSub: {
    color: Palette.textSecondary,
    fontFamily: 'DM-Sans',
    fontSize: 13,
  },
  rowFindingLyrics: {
    color: Palette.accent,
    fontFamily: 'DM-Sans',
    fontSize: 13,
  },
});
