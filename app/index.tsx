import { Feather } from '@expo/vector-icons';
import { type Href, Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { SongListItem } from '@/components/SongListItem';
import { deleteSong, getSongs } from '@/lib/storage';
import { Palette } from '@/constants/theme';
import type { Song } from '@/types';

type AnimatedSongItemProps = {
  song: Song;
  index: number;
  onPress: (id: string) => void;
  onDelete: (id: string) => void;
};

function AnimatedSongItem({ song, index, onPress, onDelete }: AnimatedSongItemProps) {
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
      <SongListItem song={song} onPress={onPress} onDelete={onDelete} />
    </Animated.View>
  );
}

export default function LibraryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
      router.push('/song/new' as Href);
    }
  }, [isLoading, router, songs.length]);

  const handleDeleteSong = useCallback(
    async (id: string) => {
      await deleteSong(id);
      await loadSongs();
    },
    [loadSongs]
  );

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

  const fabBottom = Math.max(insets.bottom + 16, 32);

  return (
    <View style={styles.container}>
      <FlatList
        contentContainerStyle={[
          songs.length === 0 ? styles.emptyContainer : styles.listContent,
          { paddingBottom: fabBottom + 72 },
        ]}
        data={songs}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          isLoading ? null : (
            <View style={styles.emptyContent}>
              <View style={styles.emptyIcon}>
                <Feather color={Palette.textDisabled} name="mic-off" size={32} />
              </View>
              <Text style={styles.emptyPrimary}>No songs yet</Text>
              <Text style={styles.emptySecondary}>Tap + to record your first.</Text>
            </View>
          )
        }
        renderItem={({ item, index }) => (
          <AnimatedSongItem
            index={index}
            onDelete={handleDeleteSong}
            onPress={handleOpenSong}
            song={item}
          />
        )}
      />

      <Pressable
        accessibilityLabel="Create a new song"
        accessibilityRole="button"
        onPress={() => router.push('/song/new' as Href)}
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
