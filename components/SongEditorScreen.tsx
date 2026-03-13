import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { SpeedSlider } from '@/components/SpeedSlider';
import { ThemedText } from '@/components/themed-text';
import { getSongs, saveSong } from '@/lib/storage';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { RecordingState, ScrollSpeed } from '@/types';

type SongEditorScreenProps = {
  songId?: string;
};

export function SongEditorScreen({ songId }: SongEditorScreenProps) {
  const router = useRouter();
  const textColor = useThemeColor({}, 'text');
  const inputBackgroundColor = useThemeColor({ light: '#F9FAFB', dark: '#1F2937' }, 'background');
  const inputBorderColor = useThemeColor({ light: '#D1D5DB', dark: '#374151' }, 'icon');

  const [name, setName] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [scrollSpeed, setScrollSpeed] = useState<ScrollSpeed>('medium');
  const [recordingState] = useState<RecordingState>('idle');
  const [isLoading, setIsLoading] = useState(Boolean(songId));
  const [isMissingSong, setIsMissingSong] = useState(false);
  const [createdAt, setCreatedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!songId) {
      setIsLoading(false);
      setIsMissingSong(false);
      return;
    }

    let isMounted = true;

    const loadSong = async () => {
      const songs = await getSongs();
      const song = songs.find((savedSong) => savedSong.id === songId);

      if (!isMounted) {
        return;
      }

      if (!song) {
        setIsMissingSong(true);
        setIsLoading(false);
        return;
      }

      setName(song.name);
      setLyrics(song.lyrics);
      setScrollSpeed(song.scrollSpeed);
      setCreatedAt(song.createdAt);
      setIsLoading(false);
    };

    void loadSong();

    return () => {
      isMounted = false;
    };
  }, [songId]);

  const handleSave = useCallback(async () => {
    if (isLoading || isMissingSong) {
      return;
    }

    await saveSong({
      createdAt: createdAt ?? new Date().toISOString(),
      id: songId ?? `song-${Date.now()}`,
      lyrics,
      name: name.trim() || 'Untitled song',
      scrollSpeed,
    });

    router.back();
  }, [createdAt, isLoading, isMissingSong, lyrics, name, router, scrollSpeed, songId]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable disabled={isLoading || isMissingSong} onPress={handleSave} style={styles.saveButton}>
              <ThemedText style={styles.saveButtonLabel}>Save</ThemedText>
            </Pressable>
          ),
          title: songId ? 'Edit Song' : 'New Song',
        }}
      />

      {isLoading ? (
        <View style={styles.centeredState}>
          <ThemedText>Loading song...</ThemedText>
        </View>
      ) : isMissingSong ? (
        <View style={styles.centeredState}>
          <ThemedText type="subtitle">Song not found</ThemedText>
        </View>
      ) : recordingState === 'idle' ? (
        <>
          <TextInput
            onChangeText={setName}
            placeholder="Song name"
            placeholderTextColor="#9CA3AF"
            style={[
              styles.nameInput,
              { backgroundColor: inputBackgroundColor, borderColor: inputBorderColor, color: textColor },
            ]}
            value={name}
          />

          <TextInput
            multiline
            onChangeText={setLyrics}
            placeholder="Paste or type lyrics here"
            placeholderTextColor="#9CA3AF"
            style={[
              styles.lyricsInput,
              { backgroundColor: inputBackgroundColor, borderColor: inputBorderColor, color: textColor },
            ]}
            textAlignVertical="top"
            value={lyrics}
          />

          <ThemedText type="defaultSemiBold">Scroll speed</ThemedText>
          <SpeedSlider onChange={setScrollSpeed} value={scrollSpeed} />
        </>
      ) : (
        <View style={styles.centeredState}>
          <ThemedText type="subtitle">Teleprompter mode active</ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  centeredState: {
    flex: 1,
    justifyContent: 'center',
  },
  saveButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  saveButtonLabel: {
    color: '#0A7EA4',
    fontWeight: '600',
  },
  nameInput: {
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  lyricsInput: {
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    fontSize: 16,
    marginBottom: 12,
    minHeight: 220,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
});
