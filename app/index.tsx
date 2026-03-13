import { Feather } from '@expo/vector-icons';
import { type Href, Stack, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { SongListItem } from '@/components/SongListItem';
import { ThemedText } from '@/components/themed-text';
import { deleteSong, getSongs } from '@/lib/storage';
import type { Song } from '@/types';

export default function LibraryScreen() {
  const router = useRouter();
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const handleDeleteSong = useCallback(async (id: string) => {
    await deleteSong(id);
    await loadSongs();
  }, [loadSongs]);

  const handleOpenSong = useCallback(
    (id: string) => {
      router.push(`/song/${id}` as Href);
    },
    [router]
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              accessibilityLabel="Create a new song"
              onPress={() => router.push('/song/new' as Href)}
              style={styles.addButton}>
              <Feather color="#0A7EA4" name="plus" size={22} />
            </Pressable>
          ),
          title: 'Songs',
        }}
      />

      <FlatList
        contentContainerStyle={songs.length === 0 ? styles.emptyStateContainer : undefined}
        data={songs}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <ThemedText style={styles.emptyStateText}>
            {isLoading ? 'Loading songs...' : 'No songs yet — tap + to start'}
          </ThemedText>
        }
        renderItem={({ item }) => (
          <SongListItem onDelete={handleDeleteSong} onPress={handleOpenSong} song={item} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  addButton: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  emptyStateContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyStateText: {
    fontSize: 18,
    lineHeight: 26,
    textAlign: 'center',
  },
});
