import { Feather } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Palette, withOpacity } from '@/constants/theme';
import type { Song } from '@/types';

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDate(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  if (dateOnly.getTime() === today.getTime()) return `Today, ${time}`;
  if (dateOnly.getTime() === yesterday.getTime()) return `Yesterday, ${time}`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + `, ${time}`;
}

function getLyricsPreview(lyrics: string): string {
  const firstLine = lyrics.split('\n').find((line) => line.trim().length > 0) ?? '';
  return firstLine.length > 55 ? firstLine.slice(0, 55) + '\u2026' : firstLine;
}

type SongListItemProps = {
  song: Song;
  onDelete: (id: string) => void;
  onPress: (id: string) => void;
};

export function SongListItem({ song, onDelete, onPress }: SongListItemProps) {
  const preview = getLyricsPreview(song.lyrics);
  const timestamp = song.recording?.recordedAt ?? song.createdAt;

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => onPress(song.id)}
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>

        {/* Artwork thumbnail */}
        <View style={styles.artworkWrap}>
          {song.artworkUrl ? (
            <>
              <Image
                source={{ uri: song.artworkUrl }}
                style={styles.artwork}
              />
              {/* Warm tint to blend into dark background */}
              <View style={styles.artworkTint} />
            </>
          ) : (
            <View style={styles.artworkPlaceholder}>
              <Feather color={Palette.textDisabled} name="music" size={20} />
            </View>
          )}
          {/* Recorded indicator dot */}
          {song.recording ? <View style={styles.recordedDot} /> : null}
        </View>

        {/* Text content */}
        <View style={styles.content}>
          <Text numberOfLines={1} style={styles.title}>
            {song.name || 'Untitled song'}
          </Text>
          {preview ? (
            <Text numberOfLines={1} style={styles.preview}>
              {preview}
            </Text>
          ) : null}
          <View style={styles.metaRow}>
            <Text style={styles.date}>{formatDate(timestamp)}</Text>
            {song.recording ? (
              <Text style={styles.duration}>
                {'▶  ' + formatDuration(song.recording.durationMs)}
              </Text>
            ) : null}
          </View>
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

const ARTWORK_SIZE = 56;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: 4,
  },
  row: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 12,
  },
  rowPressed: {
    opacity: 0.65,
  },

  // Artwork
  artworkWrap: {
    borderRadius: 8,
    flexShrink: 0,
    height: ARTWORK_SIZE,
    overflow: 'hidden',
    width: ARTWORK_SIZE,
  },
  artwork: {
    height: ARTWORK_SIZE,
    width: ARTWORK_SIZE,
  },
  artworkTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: withOpacity('#0E0C0A', 0.22),
  },
  artworkPlaceholder: {
    alignItems: 'center',
    backgroundColor: Palette.surfaceRaised,
    height: ARTWORK_SIZE,
    justifyContent: 'center',
    width: ARTWORK_SIZE,
  },
  recordedDot: {
    backgroundColor: Palette.accent,
    borderRadius: 4,
    bottom: 5,
    height: 5,
    position: 'absolute',
    right: 5,
    width: 5,
  },

  // Text
  content: {
    flex: 1,
    gap: 3,
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
    gap: 10,
    marginTop: 1,
  },
  date: {
    color: Palette.textDisabled,
    fontFamily: 'DM-Sans',
    fontSize: 12,
  },
  duration: {
    color: Palette.accent,
    fontFamily: 'DM-Sans',
    fontSize: 12,
    opacity: 0.8,
  },

  deleteButton: {
    borderRadius: 20,
    padding: 10,
  },
});
