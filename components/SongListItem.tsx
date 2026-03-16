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
  onPress: (id: string) => void;
  onRecord: (id: string) => void;
};

export function SongListItem({ song, onPress, onRecord }: SongListItemProps) {
  const subtitle = song.artist || getLyricsPreview(song.lyrics);
  const timestamp = song.recording?.recordedAt ?? song.createdAt;

  return (
    <View style={styles.container}>
      {/* Top: artwork + text — tapping opens review or editor */}
      <Pressable
        onPress={() => onPress(song.id)}
        style={({ pressed }) => [styles.topRow, pressed && styles.topRowPressed]}>
        <View style={styles.artworkWrap}>
          {song.artworkUrl ? (
            <>
              <Image source={{ uri: song.artworkUrl }} style={styles.artwork} />
              <View style={styles.artworkTint} />
            </>
          ) : (
            <View style={styles.artworkPlaceholder}>
              <Feather color={Palette.textDisabled} name="music" size={20} />
            </View>
          )}
          {song.recording ? <View style={styles.recordedDot} /> : null}
        </View>

        <View style={styles.content}>
          <Text numberOfLines={1} style={styles.title}>
            {song.name || 'Untitled song'}
          </Text>
          {subtitle ? (
            <Text numberOfLines={1} style={[styles.preview, song.artist && styles.previewArtist]}>
              {subtitle}
            </Text>
          ) : null}
          <View style={styles.metaRow}>
            <Text style={styles.date}>{formatDate(timestamp)}</Text>
            {song.recording ? (
              <Text style={styles.duration}>{'▶  ' + formatDuration(song.recording.durationMs)}</Text>
            ) : null}

          </View>
        </View>
      </Pressable>

      {/* Actions row */}
      <View style={styles.actionsRow}>
        {song.recording ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => onPress(song.id)}
            style={({ pressed }) => [styles.actionBtn, styles.actionBtnPlay, pressed && styles.actionBtnPressed]}>
            <Feather color={Palette.textSecondary} name="play" size={15} />
            <Text style={styles.actionText}>Play</Text>
          </Pressable>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={() => onRecord(song.id)}
          style={({ pressed }) => [styles.actionBtn, styles.actionBtnSing, pressed && styles.actionBtnPressed]}>
          <Feather color={Palette.accent} name="mic" size={15} />
          <Text style={[styles.actionText, styles.actionTextSing]}>
            {song.recording ? 'Re-record' : 'Sing'}
          </Text>
        </Pressable>


      </View>
    </View>
  );
}

const ARTWORK_SIZE = 56;

const styles = StyleSheet.create({
  container: {
    backgroundColor: withOpacity(Palette.surfaceRaised, 0.62),
    borderColor: withOpacity(Palette.border, 0.65),
    borderRadius: 16,
    borderWidth: 1,
    elevation: 3,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
  },

  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  topRowPressed: {
    opacity: 0.8,
  },

  // Artwork
  artworkWrap: {
    borderRadius: 12,
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
  previewArtist: {
    color: Palette.textSecondary,
    fontFamily: 'DM-Sans-SemiBold',
    fontSize: 13,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
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


  // Actions row
  actionsRow: {
    borderTopColor: withOpacity(Palette.border, 0.5),
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 8,
    padding: 10,
  },
  actionBtn: {
    alignItems: 'center',
    borderRadius: 12,
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    paddingVertical: 11,
  },
  actionBtnPlay: {
    backgroundColor: withOpacity(Palette.surfaceRaised, 0.9),
    borderColor: withOpacity(Palette.border, 0.8),
    borderWidth: 1,
  },
  actionBtnSing: {
    backgroundColor: withOpacity(Palette.accent, 0.12),
  },

  actionBtnPressed: {
    opacity: 0.5,
  },
  actionText: {
    color: Palette.textSecondary,
    fontFamily: 'DM-Sans-SemiBold',
    fontSize: 14,
  },
  actionTextSing: {
    color: Palette.accent,
  },
});
