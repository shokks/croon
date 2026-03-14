import { Feather } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, FlatList, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { SongListItem } from '@/components/SongListItem';
import { getSongs } from '@/lib/storage';
import { Palette, withOpacity } from '@/constants/theme';
import type { Song } from '@/types';

type FilterType = 'all' | 'recorded' | 'draft';

type AnimatedSongItemProps = {
  song: Song;
  index: number;
  onPress: (id: string) => void;
  onRecord: (id: string) => void;
};

function AnimatedSongItem({ song, index, onPress, onRecord }: AnimatedSongItemProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const delay = useRef(Math.min(index * 50, 250)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      delay,
      useNativeDriver: true,
    }).start();
  }, [opacity, delay]);

  return (
    <Animated.View style={{ opacity }}>
      <SongListItem song={song} onPress={onPress} onRecord={onRecord} />
    </Animated.View>
  );
}

export default function LibraryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const hasAutoRedirectedRef = useRef(false);

  const loadSongs = useCallback(async () => {
    const savedSongs = await getSongs();
    setSongs(savedSongs);
    setIsLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadSongs();
    }, [loadSongs])
  );

  useEffect(() => {
    if (isLoading || hasAutoRedirectedRef.current) {
      return;
    }

    if (songs.length === 0) {
      hasAutoRedirectedRef.current = true;
      router.push('/song/search' as Href);
    }
  }, [isLoading, router, songs.length]);

  const handleOpenSong = useCallback(
    (id: string) => {
      const song = songs.find((s) => s.id === id);
      if (song?.recording) {
        router.push(`/song/record/${id}?review=true` as Href);
      } else {
        router.push(`/song/${id}` as Href);
      }
    },
    [router, songs]
  );

  const handleRecordSong = useCallback(
    (id: string) => {
      router.push(`/song/record/${id}` as Href);
    },
    [router]
  );

  const filteredSongs = useMemo(() => {
    if (filter === 'recorded') return songs.filter((s) => s.recording);
    if (filter === 'draft') return songs.filter((s) => !s.recording);
    return songs;
  }, [songs, filter]);

  const heroSong = useMemo(() => {
    const recorded = songs.filter((s) => s.recording);
    if (recorded.length > 0) {
      return recorded.reduce((latest, s) =>
        new Date(s.recording!.recordedAt) > new Date(latest.recording!.recordedAt) ? s : latest
      );
    }
    return songs[0];
  }, [songs]);

  const fabBottom = Math.max(insets.bottom + 16, 32);

  return (
    <View style={styles.container}>
      <FlatList
        contentContainerStyle={[
          filteredSongs.length === 0 ? styles.emptyContainer : styles.listContent,
          { paddingBottom: fabBottom + 72 },
        ]}
        data={filteredSongs}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          songs.length > 0 ? (
            <View>
              {/* Hero: last recorded or most recent */}
              {heroSong ? (
                <Pressable onPress={() => handleOpenSong(heroSong.id)} style={styles.heroCard}>
                  <ImageBackground
                    imageStyle={styles.heroImage}
                    source={{ uri: heroSong.artworkUrl }}
                    style={[styles.heroArtwork, !heroSong.artworkUrl && styles.heroArtworkFallback]}>
                    <View style={styles.heroOverlay}>
                      <Text numberOfLines={1} style={styles.heroEyebrow}>
                        {heroSong.recording ? 'Last Recorded' : 'Recently Added'}
                      </Text>
                      <Text numberOfLines={1} style={styles.heroTitle}>
                        {heroSong.name || 'Untitled song'}
                      </Text>
                      <Pressable
                        onPress={() => handleRecordSong(heroSong.id)}
                        style={styles.heroAction}>
                        <Feather color={Palette.background} name="mic" size={13} />
                        <Text style={styles.heroActionText}>
                          {heroSong.recording ? 'Sing again' : 'Start recording'}
                        </Text>
                      </Pressable>
                    </View>
                  </ImageBackground>
                </Pressable>
              ) : null}

              {/* Section header */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Your Library</Text>
                <Text style={styles.sectionCount}>{songs.length}</Text>
              </View>

              {/* Filter chips */}
              <View style={styles.filterRow}>
                {(['all', 'recorded', 'draft'] as const).map((f) => (
                  <Pressable
                    key={f}
                    onPress={() => setFilter(f)}
                    style={[styles.chip, filter === f && styles.chipActive]}>
                    <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>
                      {f === 'all' ? 'All' : f === 'recorded' ? 'Recorded' : 'Drafts'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null
        }
        ListEmptyComponent={
          isLoading ? null : (
            <View style={styles.emptyContent}>
              <View style={styles.emptyIcon}>
                <Feather
                  color={Palette.textDisabled}
                  name={filter === 'recorded' ? 'mic-off' : 'music'}
                  size={32}
                />
              </View>
              <Text style={styles.emptyPrimary}>
                {filter === 'recorded' ? 'No recordings yet' : 'No songs yet'}
              </Text>
              <Text style={styles.emptySecondary}>
                {filter === 'recorded'
                  ? 'Tap Sing on any song to record your first take.'
                  : 'Tap + to add your first song.'}
              </Text>
            </View>
          )
        }
        renderItem={({ item, index }) => (
          <AnimatedSongItem
            index={index}
            onPress={handleOpenSong}
            onRecord={handleRecordSong}
            song={item}
          />
        )}
      />

      <Pressable
        accessibilityLabel="Create a new song"
        accessibilityRole="button"
        onPress={() => router.push('/song/search' as Href)}
        style={[styles.fab, { bottom: fabBottom }]}>
        <Feather color={Palette.background} name="plus" size={26} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Palette.background,
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  // Hero card
  heroCard: {
    borderRadius: 18,
    marginBottom: 20,
    overflow: 'hidden',
  },
  heroArtwork: {
    aspectRatio: 1,
    backgroundColor: Palette.surfaceRaised,
    justifyContent: 'flex-end',
    width: '100%',
  },
  heroArtworkFallback: {
    backgroundColor: Palette.surface,
  },
  heroImage: {
    borderRadius: 18,
  },
  heroOverlay: {
    backgroundColor: 'rgba(0,0,0,0.38)',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  heroEyebrow: {
    color: withOpacity('#D7CFF2', 0.85),
    fontFamily: 'DM-Sans-SemiBold',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: Palette.textPrimary,
    fontFamily: 'DM-Sans-SemiBold',
    fontSize: 22,
    lineHeight: 28,
  },
  heroAction: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Palette.accent,
    borderRadius: 20,
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  heroActionText: {
    color: Palette.background,
    fontFamily: 'DM-Sans-SemiBold',
    fontSize: 13,
  },

  // Section header + filter chips
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    color: Palette.textPrimary,
    fontFamily: 'DM-Sans-SemiBold',
    fontSize: 17,
  },
  sectionCount: {
    color: Palette.textDisabled,
    fontFamily: 'DM-Sans',
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    borderColor: Palette.border,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  chipActive: {
    backgroundColor: withOpacity(Palette.accent, 0.15),
    borderColor: withOpacity(Palette.accent, 0.5),
  },
  chipText: {
    color: Palette.textSecondary,
    fontFamily: 'DM-Sans',
    fontSize: 14,
  },
  chipTextActive: {
    color: Palette.accent,
    fontFamily: 'DM-Sans-SemiBold',
  },

  // Empty state
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyContent: {
    alignItems: 'center',
    gap: 10,
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: 32,
    height: 64,
    justifyContent: 'center',
    marginBottom: 4,
    width: 64,
  },
  emptyPrimary: {
    color: Palette.textSecondary,
    fontFamily: 'DM-Sans-SemiBold',
    fontSize: 17,
    lineHeight: 24,
    textAlign: 'center',
  },
  emptySecondary: {
    color: Palette.textDisabled,
    fontFamily: 'DM-Sans',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },

  fab: {
    alignItems: 'center',
    backgroundColor: Palette.accent,
    borderRadius: 28,
    elevation: 4,
    height: 56,
    justifyContent: 'center',
    position: 'absolute',
    right: 20,
    shadowColor: Palette.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    width: 56,
  },
});
