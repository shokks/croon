import { Feather } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import * as Sharing from 'expo-sharing';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Palette, withOpacity } from '@/constants/theme';

type PostRecordingViewProps = {
  recordingUri: string | null;
  onBack: (uri: string, durationMs: number) => void;
  onEdit?: () => void;
  onReRecord: () => void;
  songName: string;
  songArtist?: string;
  lyrics?: string;
  initialDurationMs?: number;
  recordedAt?: string;
};

function formatDuration(seconds: number): string {
  if (!seconds || !Number.isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatRecordedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const BAR_COUNT = 56;

function buildWaveform(): number[] {
  return Array.from({ length: BAR_COUNT }, (_, i) => {
    const t = i / BAR_COUNT;
    const h =
      0.5 +
      0.28 * Math.sin(t * Math.PI * 7) +
      0.14 * Math.sin(t * Math.PI * 17) +
      0.08 * Math.sin(t * Math.PI * 37);
    return Math.max(0.08, Math.min(1, h));
  });
}

export function PostRecordingView({ initialDurationMs, lyrics, onBack, onEdit, onReRecord, recordedAt, recordingUri, songArtist, songName }: PostRecordingViewProps) {
  const insets = useSafeAreaInsets();
  const player = useAudioPlayer();
  const playerStatus = useAudioPlayerStatus(player);

  const webAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isWebPlaying, setIsWebPlaying] = useState(false);
  const [webDuration, setWebDuration] = useState(0);
  const [webCurrentTime, setWebCurrentTime] = useState(0);
  const [webCanPlay, setWebCanPlay] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [waveformWidth, setWaveformWidth] = useState(0);

  const waveformHeights = useMemo(() => buildWaveform(), []);

  useEffect(() => {
    if (Platform.OS === 'web' || !recordingUri) return;
    player.replace(recordingUri);
  }, [player, recordingUri]);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    setIsWebPlaying(false);
    setWebDuration(0);
    setWebCurrentTime(0);
    setWebCanPlay(true);

    if (webAudioRef.current) {
      webAudioRef.current.pause();
      webAudioRef.current = null;
    }

    if (!recordingUri) {
      return;
    }

    const audio = new Audio(recordingUri);
    audio.preload = 'auto';

    const onLoadedMetadata = () => {
      setWebDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    };
    const onTimeUpdate = () => {
      setWebCurrentTime(audio.currentTime || 0);
    };
    const onPlay = () => setIsWebPlaying(true);
    const onPause = () => setIsWebPlaying(false);
    const onEnded = () => {
      setIsWebPlaying(false);
      setWebCurrentTime(0);
    };
    const onError = () => {
      setWebCanPlay(false);
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    audio.load();

    webAudioRef.current = audio;

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);

      if (webAudioRef.current === audio) {
        webAudioRef.current = null;
      }
    };
  }, [recordingUri]);

  const handlePlayPress = useCallback(async () => {
    if (!recordingUri) { setErrorMessage('No recording available yet.'); return; }
    try {
      setErrorMessage(null);
      if (Platform.OS === 'web') {
        if (!webCanPlay) {
          setErrorMessage('Playback unavailable in browser — open on your phone to play.');
          return;
        }
        const webAudio = webAudioRef.current;
        if (!webAudio || webAudio.readyState === 0) {
          setErrorMessage('Playback unavailable in browser — open on your phone to play.');
          return;
        }
        if (isWebPlaying) {
          webAudio.pause();
          webAudio.currentTime = 0;
          setWebCurrentTime(0);
          return;
        }
        if (webAudio.duration && webAudio.currentTime >= webAudio.duration - 0.01) {
          webAudio.currentTime = 0;
          setWebCurrentTime(0);
        }
        await webAudio.play();
        return;
      }
      if (playerStatus.playing) { player.pause(); await player.seekTo(0); return; }
      if (playerStatus.didJustFinish) await player.seekTo(0);
      player.play();
    } catch {
      setErrorMessage('Could not play the recording.');
    }
  }, [isWebPlaying, player, playerStatus.didJustFinish, playerStatus.playing, recordingUri, webCanPlay]);

  const handleSharePress = useCallback(async () => {
    if (!recordingUri) { setErrorMessage('No recording available yet.'); return; }
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) { setErrorMessage('Sharing is not available on this device.'); return; }
    setErrorMessage(null);
    await Sharing.shareAsync(recordingUri);
  }, [recordingUri]);

  const handleReRecord = useCallback(async () => {
    if (webAudioRef.current) {
      webAudioRef.current.pause();
      webAudioRef.current.currentTime = 0;
      setIsWebPlaying(false);
      setWebCurrentTime(0);
    }
    try {
      player.pause();
      await player.seekTo(0);
    } catch {}

    setErrorMessage(null);
    onReRecord();
  }, [onReRecord, player]);

  const handleBack = useCallback(async () => {
    if (webAudioRef.current) {
      webAudioRef.current.pause();
      webAudioRef.current.currentTime = 0;
      setIsWebPlaying(false);
      setWebCurrentTime(0);
    }
    try {
      player.pause();
      await player.seekTo(0);
    } catch {}
    setErrorMessage(null);
    const playerDurationMs = Math.round((Platform.OS === 'web' ? webDuration : playerStatus.duration) * 1000);
    const durationMs = playerDurationMs > 0 ? playerDurationMs : (initialDurationMs ?? 0);
    onBack(recordingUri ?? '', durationMs);
  }, [initialDurationMs, onBack, player, playerStatus.duration, recordingUri, webDuration]);

  const isPlaying = Platform.OS === 'web' ? isWebPlaying : playerStatus.playing;
  const playerDuration = Platform.OS === 'web' ? webDuration : playerStatus.duration;
  const duration = playerDuration > 0 ? playerDuration : (initialDurationMs ?? 0) / 1000;
  const currentTime = Platform.OS === 'web' ? webCurrentTime : playerStatus.currentTime;
  const playProgress = duration > 0 ? Math.min(currentTime / duration, 1) : 0;

  const MAX_BAR_HEIGHT = 48;

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 16, paddingBottom: Math.max(insets.bottom, 24) },
      ]}>

      {/* Header */}
      <View style={styles.topRow}>
        <Pressable
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 16 }}
          onPress={() => { void handleBack(); }}
          style={styles.backButton}>
          <Feather color={Palette.accent} name="chevron-left" size={26} />
        </Pressable>

        <View style={styles.songMeta}>
          <Text numberOfLines={1} style={styles.songName}>
            {songName || 'Untitled song'}
          </Text>
          {songArtist ? (
            <Text numberOfLines={1} style={styles.songArtist}>{songArtist}</Text>
          ) : null}
        </View>

        {onEdit ? (
          <Pressable
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={onEdit}
            style={styles.editAction}>
            <Feather color={Palette.textSecondary} name="edit-2" size={17} />
          </Pressable>
        ) : <View style={styles.editPlaceholder} />}
      </View>

      {/* Waveform card */}
      <View style={lyrics ? styles.waveformCard : styles.waveformCardCentered}>
        <View
          onLayout={(e: LayoutChangeEvent) => setWaveformWidth(e.nativeEvent.layout.width)}
          style={styles.waveformContainer}>
          {waveformHeights.map((h, i) => (
            <View
              key={i}
              style={[styles.waveformBar, { height: Math.max(2, h * MAX_BAR_HEIGHT) }]}
            />
          ))}
          {waveformWidth > 0 && (
            <View style={[styles.playhead, { left: playProgress * waveformWidth }]} />
          )}
        </View>
        <View style={styles.waveformMeta}>
          <Text style={styles.duration}>{formatDuration(duration)}</Text>
          <Pressable onPress={() => void handlePlayPress()} style={styles.waveformPlayBtn}>
            <Feather color={Palette.background} name={isPlaying ? 'square' : 'play'} size={22} />
          </Pressable>
        </View>
      </View>

      {/* Lyrics — only in review mode */}
      {lyrics ? (
        <ScrollView
          contentContainerStyle={styles.lyricsContent}
          showsVerticalScrollIndicator={false}
          style={styles.lyricsScroll}>
          <Text style={styles.lyricsText}>{lyrics}</Text>
        </ScrollView>
      ) : null}

      {/* Action row — Re-record | Share */}
      <View style={styles.actionRow}>
        <Pressable
          onPress={() => void handleReRecord()}
          style={({ pressed }) => [styles.sideAction, pressed && styles.sideActionPressed]}>
          <Feather color={Palette.textSecondary} name="rotate-ccw" size={16} />
          <Text style={styles.sideActionLabel}>Re-record</Text>
        </Pressable>

        <Pressable
          onPress={() => void handleSharePress()}
          style={({ pressed }) => [styles.sideAction, pressed && styles.sideActionPressed]}>
          <Feather color={Palette.textSecondary} name="share" size={16} />
          <Text style={styles.sideActionLabel}>Share</Text>
        </Pressable>
      </View>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Palette.background,
    flex: 1,
    paddingHorizontal: 16,
  },

  // Header
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  songMeta: {
    flex: 1,
    gap: 2,
  },
  songName: {
    color: Palette.textPrimary,
    fontFamily: 'DM-Sans-SemiBold',
    fontSize: 18,
  },
  songArtist: {
    color: Palette.textSecondary,
    fontFamily: 'DM-Sans',
    fontSize: 13,
  },
  backButton: {
    padding: 4,
  },
  editAction: {
    padding: 4,
  },
  editPlaceholder: {
    width: 25,
  },

  // Waveform card (matches library card language)
  waveformCard: {
    backgroundColor: withOpacity(Palette.surfaceRaised, 0.62),
    borderColor: withOpacity(Palette.border, 0.65),
    borderRadius: 16,
    borderWidth: 1,
    elevation: 3,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
  },
  waveformCardCentered: {
    backgroundColor: withOpacity(Palette.surfaceRaised, 0.62),
    borderColor: withOpacity(Palette.border, 0.65),
    borderRadius: 16,
    borderWidth: 1,
    elevation: 3,
    flex: 1,
    justifyContent: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
  },
  waveformContainer: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    height: 64,
    overflow: 'visible',
    position: 'relative',
  },
  waveformBar: {
    backgroundColor: withOpacity(Palette.accent, 0.55),
    borderRadius: 2,
    flex: 1,
    marginHorizontal: 0.75,
  },
  playhead: {
    backgroundColor: Palette.accent,
    bottom: 0,
    position: 'absolute',
    top: 0,
    width: 1.5,
  },
  waveformMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  duration: {
    color: Palette.textSecondary,
    fontFamily: 'DM-Sans',
    fontSize: 13,
  },
  waveformPlayBtn: {
    alignItems: 'center',
    backgroundColor: Palette.accent,
    borderRadius: 24,
    elevation: 6,
    height: 48,
    justifyContent: 'center',
    shadowColor: Palette.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    width: 48,
  },

  // Lyrics
  lyricsScroll: {
    flex: 1,
    marginBottom: 16,
  },
  lyricsContent: {
    paddingBottom: 8,
  },
  lyricsText: {
    color: Palette.textSecondary,
    fontFamily: 'Lora',
    fontSize: 19,
    lineHeight: 34,
  },

  // Action row — Re-record | Share (same card style as library action buttons)
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  sideAction: {
    alignItems: 'center',
    backgroundColor: withOpacity(Palette.surfaceRaised, 0.62),
    borderColor: withOpacity(Palette.border, 0.65),
    borderRadius: 14,
    borderWidth: 1,
    elevation: 3,
    flex: 1,
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
  },
  sideActionPressed: {
    opacity: 0.65,
  },
  sideActionLabel: {
    color: Palette.textSecondary,
    fontFamily: 'DM-Sans',
    fontSize: 13,
  },

  errorText: {
    color: Palette.recordRed,
    fontFamily: 'DM-Sans',
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },
});
