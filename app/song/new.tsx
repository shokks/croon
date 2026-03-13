import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { saveSong } from '@/lib/storage';

export default function NewSongPlaceholderScreen() {
  const router = useRouter();

  const handleCreateSampleSong = async () => {
    const now = new Date().toISOString();

    await saveSong({
      createdAt: now,
      id: `sample-${Date.now()}`,
      lyrics: 'This is sample lyrics for Task 2.7 verification.',
      name: 'Sample Song',
      scrollSpeed: 'medium',
    });

    router.back();
  };

  return (
    <View style={styles.container}>
      <ThemedText type="subtitle">Song editor is up next.</ThemedText>
      <ThemedText style={styles.description}>
        The full New Song screen will be implemented in Task 3.0.
      </ThemedText>
      <Pressable onPress={handleCreateSampleSong} style={styles.seedButton}>
        <ThemedText style={styles.seedButtonText}>Create sample song</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 12,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  description: {
    textAlign: 'center',
  },
  seedButton: {
    alignItems: 'center',
    backgroundColor: '#0A7EA4',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  seedButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
