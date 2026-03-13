import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/theme';
import type { Song } from '@/types';

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

type SongListItemProps = {
  song: Song;
  onDelete: (id: string) => void;
  onPress: (id: string) => void;
};

function formatDate(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function getLyricsPreview(lyrics: string): string {
  const firstLine = lyrics.split('\n').find((line) => line.trim().length > 0) ?? '';
  return firstLine.length > 60 ? firstLine.slice(0, 60) + '\u2026' : firstLine;
}

export function SongListItem({ song, onDelete, onPress }: SongListItemProps) {
  const preview = getLyricsPreview(song.lyrics);

  return (
    <View style={styles.container}>
      {song.recording ? <View style={styles.recordedAccent} /> : null}

      <Pressable
        onPress={() => onPress(song.id)}
        style={({ pressed }) => [styles.content, pressed && styles.contentPressed]}>
        <Text numberOfLines={1} style={styles.title}>
          {song.name || 'Untitled song'}
        </Text>
        {preview ? (
          <Text numberOfLines={1} style={styles.preview}>
            {preview}
          </Text>
        ) : null}
        <View style={styles.metaRow}>
          <Text style={styles.date}>{formatDate(song.createdAt)}</Text>
          {song.recording ? (
            <View style={styles.recordingBadge}>
              <Text style={styles.recordingBadgeText}>
                {'▶  ' + formatDuration(song.recording.durationMs)}
              </Text>
            </View>
          ) : null}
        </View>
      </Pressable>

      <Pressable
        accessibilityLabel={`Delete ${song.name || 'song'}`}
        accessibilityRole="button"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        onPress={() => onDelete(song.id)}
        style={styles.deleteButton}>
        <Feather color={Palette.textDisabled} name="trash-2" size={15} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    minHeight: 64,
    overflow: 'hidden',
    paddingRight: 8,
    paddingVertical: 14,
  },
  recordedAccent: {
    alignSelf: 'stretch',
    backgroundColor: Palette.accent,
    marginRight: 14,
    opacity: 0.6,
    width: 3,
  },
  content: {
    flex: 1,
    gap: 3,
    paddingLeft: 16,
  },
  contentPressed: {
    opacity: 0.7,
  },
  title: {
    color: Palette.textPrimary,
    fontFamily: 'DM-Sans-SemiBold',
    fontSize: 16,
    lineHeight: 22,
  },
  preview: {
    color: Palette.textSecondary,
    fontFamily: 'DM-Sans',
    fontSize: 13,
    lineHeight: 18,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  date: {
    color: Palette.textDisabled,
    fontFamily: 'DM-Sans',
    fontSize: 12,
    lineHeight: 16,
  },
  recordingBadge: {
    backgroundColor: Palette.accentMuted,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  recordingBadgeText: {
    color: Palette.accent,
    fontFamily: 'DM-Sans',
    fontSize: 11,
    lineHeight: 16,
  },
  deleteButton: {
    borderRadius: 20,
    padding: 10,
  },
});
