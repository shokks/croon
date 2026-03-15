import { Feather } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LyricsScrollView } from '@/components/LyricsScrollView';
import { PostRecordingView } from '@/components/PostRecordingView';
import { RecordButton } from '@/components/RecordButton';
import { Palette } from '@/constants/theme';
import { useRecording } from '@/lib/useRecording';
import { getSongs, saveRecording, saveSong } from '@/lib/storage';
import { parseSyncedLyrics } from '@/lib/lyricsSync';
import type { ScrollSpeed, Song, SyncedLyricLine } from '@/types';

type RecordingScreenProps = {
  songId: string;
  reviewMode?: boolean;
};

const SPEED_OPTIONS: { label: string; value: ScrollSpeed }[] = [
  { label: 'Ballad', value: 'slow' },
  { label: 'Normal', value: 'medium' },
  { label: 'Uptempo', value: 'fast' },
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function AudioActivityBar() {
  const opacityAnim = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, { toValue: 0.5, duration: 900, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0.15, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacityAnim]);

  return <Animated.View style={[styles.audioActivityBar, { opacity: opacityAnim }]} />;
}

export function RecordingScreen({ reviewMode = false, songId }: RecordingScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [songName, setSongName] = useState('');
  const [songArtist, setSongArtist] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [scrollSpeed, setScrollSpeed] = useState<ScrollSpeed>('medium');
  const [syncedLyrics, setSyncedLyrics] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [reviewUri, setReviewUri] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const songRef = useRef<Song | null>(null);

  const { errorMessage, recordingState, recordingUri, resetRecording, startRecording, stopRecording } =
    useRecording();

  useEffect(() => {
    void (async () => {
      const songs = await getSongs();
      const song = songs.find((s) => s.id === songId);
      if (!song) return;
      setSongName(song.name);
      setSongArtist(song.artist ?? '');
      setLyrics(song.lyrics);
      setScrollSpeed(song.scrollSpeed);
      setSyncedLyrics(song.syncedLyrics ?? null);
      songRef.current = song;
      if (reviewMode && song.recording?.uri) {
        setReviewUri(song.recording.uri);
      }
    })();
  }, [reviewMode, songId]);

  // Elapsed timer — only runs while recording
  useEffect(() => {
    if (recordingState === 'recording') {
      setElapsedSeconds(0);
      setElapsedMs(0);
      const startedAt = Date.now();
      timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
      const msTimer = setInterval(() => setElapsedMs(Date.now() - startedAt), 100);
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        clearInterval(msTimer);
      };
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      setElapsedMs(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [recordingState]);

  const handleSpeedChange = useCallback(
    async (speed: ScrollSpeed) => {
      setScrollSpeed(speed);
      if (!songRef.current) return;
      const updated = { ...songRef.current, scrollSpeed: speed };
      songRef.current = updated;
      await saveSong(updated);
    },
    []
  );

  const handleStartRecording = useCallback(async () => {
    await startRecording();
  }, [startRecording]);

  const handleStopRecording = useCallback(async () => {
    await stopRecording();
  }, [stopRecording]);

  const handleDone = useCallback(async (uri: string, durationMs: number) => {
    if (uri) {
      await saveRecording(songId, { uri, durationMs, recordedAt: new Date().toISOString() });
    }
    router.dismissAll();
  }, [router, songId]);

  const handleReviewDone = useCallback(() => {
    router.dismissAll();
  }, [router]);

  const handleEdit = useCallback(() => {
    router.replace(`/song/${songId}` as Parameters<typeof router.replace>[0]);
  }, [router, songId]);

  const syncedLines = useMemo<SyncedLyricLine[]>(() => parseSyncedLyrics(syncedLyrics), [syncedLyrics]);

  const bottomInset = Math.max(insets.bottom, 16);

  // ─── Review (existing recording opened from Library) ─────────────────────────

  if (reviewMode && reviewUri && recordingState === 'idle') {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <PostRecordingView
          artworkUrl={songRef.current?.artworkUrl}
          externalLinks={songRef.current?.externalLinks}
          initialDurationMs={songRef.current?.recording?.durationMs}
          lyrics={lyrics}
          onBack={handleReviewDone}
          onEdit={handleEdit}
          onReRecord={() => setReviewUri(null)}
          recordedAt={songRef.current?.recording?.recordedAt}
          recordingUri={reviewUri}
          songArtist={songArtist}
          songName={songName}
        />
      </View>
    );
  }

  // ─── Pre-Record ──────────────────────────────────────────────────────────────

  if (recordingState === 'idle') {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />

        <View style={[styles.backRow, { paddingTop: insets.top + 8 }]}>
          <Pressable
            accessibilityLabel="Go back"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 16 }}
            onPress={() => router.back()}
            style={styles.backButton}>
            <Feather color={Palette.accent} name="chevron-left" size={26} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.previewContent}
          showsVerticalScrollIndicator={false}
          style={styles.lyricsScroll}>
          <Text style={styles.lyricsPreviewText}>{lyrics || 'No lyrics yet.'}</Text>
        </ScrollView>

        <View style={styles.speedRow}>
          {SPEED_OPTIONS.map((opt) => {
            const active = scrollSpeed === opt.value;
            return (
              <Pressable
                key={opt.value}
                accessibilityLabel={`Scroll speed: ${opt.label}`}
                accessibilityState={{ selected: active }}
                onPress={() => void handleSpeedChange(opt.value)}
                style={[styles.speedChip, active && styles.speedChipActive]}>
                <Text style={[styles.speedLabel, active && styles.speedLabelActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.recordArea, { paddingBottom: bottomInset }]}>
          <RecordButton
            onStart={() => void handleStartRecording()}
            onStop={() => void handleStopRecording()}
            recordingState={recordingState}
          />
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        </View>
      </View>
    );
  }

  // ─── Recording ───────────────────────────────────────────────────────────────

  if (recordingState === 'recording') {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <LyricsScrollView
          lyrics={lyrics}
          scrollSpeed={scrollSpeed}
          syncedLines={syncedLines.length > 0 ? syncedLines : undefined}
          currentMs={syncedLines.length > 0 ? elapsedMs : undefined}
        />
        <AudioActivityBar />
        <View style={[styles.recordArea, { paddingBottom: bottomInset }]}>
          <Text style={styles.timer}>{formatTime(elapsedSeconds)}</Text>
          <RecordButton
            onStart={() => void handleStartRecording()}
            onStop={() => void handleStopRecording()}
            recordingState={recordingState}
          />
        </View>
      </View>
    );
  }

  // ─── Post-Recording ──────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <PostRecordingView
        artworkUrl={songRef.current?.artworkUrl}
        externalLinks={songRef.current?.externalLinks}
        onBack={(uri, durationMs) => { void handleDone(uri, durationMs); }}
        onReRecord={resetRecording}
        recordingUri={recordingUri}
        songArtist={songArtist}
        songName={songName}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Palette.background,
    flex: 1,
  },
  backRow: {
    paddingBottom: 8,
    paddingHorizontal: 12,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  lyricsScroll: {
    flex: 1,
  },
  previewContent: {
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  lyricsPreviewText: {
    color: Palette.textSecondary,
    fontFamily: 'Lora',
    fontSize: 22,
    lineHeight: 37,
  },
  speedRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 8,
    paddingHorizontal: 20,
  },
  speedChip: {
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderColor: Palette.border,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    height: 38,
    justifyContent: 'center',
  },
  speedChipActive: {
    backgroundColor: Palette.accentMuted,
    borderColor: Palette.accent,
  },
  speedLabel: {
    color: Palette.textSecondary,
    fontFamily: 'DM-Sans',
    fontSize: 14,
  },
  speedLabelActive: {
    color: Palette.accent,
    fontFamily: 'DM-Sans-SemiBold',
    fontSize: 14,
  },
  recordArea: {
    alignItems: 'center',
    gap: 14,
    paddingTop: 12,
  },
  audioActivityBar: {
    backgroundColor: Palette.accent,
    height: 2,
    marginHorizontal: 20,
  },
  timer: {
    color: Palette.textDisabled,
    fontFamily: 'DM-Sans',
    fontSize: 14,
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
  },
  errorText: {
    color: Palette.recordRed,
    fontFamily: 'DM-Sans',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
});
