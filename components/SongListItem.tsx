import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { Song } from '@/types';

type SongListItemProps = {
  song: Song;
  onDelete: (id: string) => void;
};

function formatCreatedDate(createdAt: string): string {
  const timestamp = new Date(createdAt);

  if (Number.isNaN(timestamp.getTime())) {
    return 'Unknown date';
  }

  return timestamp.toLocaleDateString();
}

export function SongListItem({ song, onDelete }: SongListItemProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="defaultSemiBold" numberOfLines={1}>
          {song.name || 'Untitled song'}
        </ThemedText>
        <ThemedText style={styles.dateText}>Created {formatCreatedDate(song.createdAt)}</ThemedText>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Delete ${song.name || 'song'}`}
        onPress={() => onDelete(song.id)}
        style={styles.deleteButton}>
        <Feather color="#DC2626" name="trash-2" size={18} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#D1D5DB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  content: {
    flex: 1,
    gap: 4,
    marginRight: 12,
  },
  dateText: {
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 18,
  },
  deleteButton: {
    borderRadius: 20,
    padding: 8,
  },
});
