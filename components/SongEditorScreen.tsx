import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { type Href, Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Palette } from '@/constants/theme';
import { getSongs, saveSong } from '@/lib/storage';
import type { ScrollSpeed, SongRecording } from '@/types';

type SongEditorScreenProps = {
  songId?: string;
  prefillName?: string;
  prefillLyrics?: string;
  lyricsSource?: 'lrclib' | 'manual';
  prefillSyncedLyrics?: string;
  prefillArtworkUrl?: string;
};

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function SongEditorScreen({
  songId,
  prefillName,
  prefillLyrics,
  lyricsSource,
  prefillSyncedLyrics,
  prefillArtworkUrl,
}: SongEditorScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [scrollSpeed, setScrollSpeed] = useState<ScrollSpeed>('medium');
  const [isLoading, setIsLoading] = useState(Boolean(songId));
  const [isMissingSong, setIsMissingSong] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [lastRecording, setLastRecording] = useState<SongRecording | null>(null);

  const miniPlayer = useAudioPlayer();
  const miniPlayerStatus = useAudioPlayerStatus(miniPlayer);

  const stableSongId = useRef(songId ?? `song-${Date.now()}`);
  const createdAtRef = useRef<string | null>(null);
  const lyricsRef = useRef<TextInput>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs tracking latest values so doSave never captures stale state
  const nameRef = useRef('');
  const lyricsValueRef = useRef('');
  const scrollSpeedRef = useRef<ScrollSpeed>('medium');
  const lastRecordingRef = useRef<SongRecording | null>(null);
  // True once an existing song has finished loading (new songs start true)
  const isLoadedRef = useRef(!songId);

  // Prefill support (new songs from search)
  const syncedLyricsRef = useRef<string | null>(prefillSyncedLyrics?.trim() || null);
  const artworkUrlRef = useRef<string | null>(prefillArtworkUrl?.trim() || null);
  const [isPrefilled, setIsPrefilled] = useState(
    lyricsSource === 'lrclib' && Boolean(prefillLyrics?.trim())
  );

  // 0 = preview mode, 1 = edit mode
  const modeAnim = useRef(new Animated.Value(0)).current;

  // Load existing song (or apply prefill for new songs)
  useEffect(() => {
    if (!songId) {
      if (prefillName?.trim()) {
        setName(prefillName.trim());
        nameRef.current = prefillName.trim();
      }
      if (prefillLyrics?.trim()) {
        setLyrics(prefillLyrics.trim());
        lyricsValueRef.current = prefillLyrics.trim();
      }
      setIsLoading(false);
      // If we have prefill data, save immediately so the library reflects it
      // the moment the user navigates back — avoids a race with useFocusEffect cleanup.
      if (prefillName?.trim() || prefillLyrics?.trim()) {
        createdAtRef.current = new Date().toISOString();
        void doSave();
      }
      return;
    }

    let mounted = true;

    void (async () => {
      const songs = await getSongs();
      const song = songs.find((s) => s.id === songId);

      if (!mounted) return;

      if (!song) {
        setIsMissingSong(true);
        setIsLoading(false);
        return;
      }

      setName(song.name);
      setLyrics(song.lyrics);
      setScrollSpeed(song.scrollSpeed);
      setLastRecording(song.recording ?? null);
      nameRef.current = song.name;
      lyricsValueRef.current = song.lyrics;
      scrollSpeedRef.current = song.scrollSpeed;
      lastRecordingRef.current = song.recording ?? null;
      createdAtRef.current = song.createdAt;
      stableSongId.current = song.id;
      artworkUrlRef.current = song.artworkUrl ?? null;
      syncedLyricsRef.current = song.syncedLyrics ?? null;
      isLoadedRef.current = true;
      setIsLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [songId]);

  // Keyboard mode transitions
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = () => {
      setIsEditing(true);
      Animated.timing(modeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    };

    const onHide = () => {
      setIsEditing(false);
      Animated.timing(modeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    };

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [modeAnim]);

  // Load recording into mini-player when available (native only)
  useEffect(() => {
    if (Platform.OS === 'web' || !lastRecording?.uri) return;
    miniPlayer.replace(lastRecording.uri);
  }, [miniPlayer, lastRecording?.uri]);

  const handleMiniPlayerPress = useCallback(() => {
    if (!lastRecording?.uri) return;
    if (miniPlayerStatus.playing) {
      miniPlayer.pause();
    } else {
      if (miniPlayerStatus.didJustFinish) {
        void miniPlayer.seekTo(0);
      }
      miniPlayer.play();
    }
  }, [lastRecording?.uri, miniPlayer, miniPlayerStatus.didJustFinish, miniPlayerStatus.playing]);

  // Auto-save — reads from refs so it is always stable and never stale
  const doSave = useCallback(async () => {
    if (!createdAtRef.current) {
      // New song: only save if the user has actually typed something
      if (!nameRef.current.trim() && !lyricsValueRef.current.trim()) return;
      createdAtRef.current = new Date().toISOString();
    }
    await saveSong({
      id: stableSongId.current,
      name: nameRef.current.trim() || 'Untitled song',
      lyrics: lyricsValueRef.current,
      scrollSpeed: scrollSpeedRef.current,
      createdAt: createdAtRef.current,
      recording: lastRecordingRef.current ?? undefined,
      syncedLyrics: syncedLyricsRef.current ?? undefined,
      artworkUrl: artworkUrlRef.current ?? undefined,
    });
  }, []);

  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => void doSave(), 400);
  }, [doSave]);

  // Flush save when leaving the screen — stable callback, reads from refs
  useFocusEffect(
    useCallback(() => {
      return () => {
        if (!isLoadedRef.current) return; // existing song not yet loaded, skip
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        void doSave();
      };
    }, [doSave])
  );

  const handleNameChange = (text: string) => {
    setName(text);
    nameRef.current = text;
    scheduleSave();
  };

  const handleLyricsChange = (text: string) => {
    setLyrics(text);
    lyricsValueRef.current = text;
    if (isPrefilled) setIsPrefilled(false);
    scheduleSave();
  };

  const handleRecord = useCallback(async () => {
    if (!lyricsValueRef.current.trim()) return;
    Keyboard.dismiss();
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    await doSave();
    router.push(`/song/record/${stableSongId.current}` as Href);
  }, [doSave, router]);

  const editLayerOpacity = modeAnim;
  const previewLayerOpacity = modeAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  const hasLyrics = lyrics.trim().length > 0;
  const bottomInset = Math.max(insets.bottom, 16);

  const headerRight = isEditing ? (
    <Pressable
      hitSlop={{ top: 8, bottom: 8, left: 16, right: 8 }}
      onPress={() => Keyboard.dismiss()}
      style={styles.headerPencil}>
      <Text style={styles.headerDoneLabel}>Done</Text>
    </Pressable>
  ) : null;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: '' }} />
      </View>
    );
  }

  if (isMissingSong) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: '' }} />
        <View style={styles.centered}>
          <Text style={styles.missingText}>Song not found</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 44 : 0}
      style={styles.container}>
      <Stack.Screen options={{ title: name.trim() || 'New Song', headerRight: () => headerRight }} />

      {/* Song name */}
      <TextInput
        blurOnSubmit={false}
        onChangeText={handleNameChange}
        onSubmitEditing={() => lyricsRef.current?.focus()}
        placeholder="Song name..."
        placeholderTextColor={Palette.textSecondary}
        returnKeyType="next"
        style={styles.nameInput}
        value={name}
      />

      <View style={styles.divider} />

      {/* Lyrics area — crossfade between edit (DM-Sans) and Lora preview */}
      <View style={styles.lyricsContainer}>
        <Animated.View
          pointerEvents={isEditing ? 'auto' : 'none'}
          style={[StyleSheet.absoluteFill, { opacity: editLayerOpacity }]}>
          <TextInput
            multiline
            onChangeText={handleLyricsChange}
            placeholder="Paste or type your lyrics..."
            placeholderTextColor={Palette.textDisabled}
            ref={lyricsRef}
            scrollEnabled
            style={styles.lyricsEditInput}
            textAlignVertical="top"
            value={lyrics}
          />
        </Animated.View>

        <Animated.View
          pointerEvents={isEditing ? 'none' : 'auto'}
          style={[StyleSheet.absoluteFill, { opacity: previewLayerOpacity }]}>
          <ScrollView
            contentContainerStyle={styles.lyricsPreviewContent}
            showsVerticalScrollIndicator={false}>
            <Text style={lyrics ? styles.lyricsPreviewText : styles.lyricsPreviewPlaceholder}>
              {lyrics || 'Tap the pencil to add lyrics...'}
            </Text>
          </ScrollView>
        </Animated.View>
      </View>


      {/* LRCLIB helper */}
      {isPrefilled && (
        <Text style={styles.prefillHelper}>Lyrics auto-filled — tap to edit.</Text>
      )}

      {/* Last take mini-player — only when a recording exists */}
      {lastRecording && !isEditing && (
        <Pressable onPress={handleMiniPlayerPress} style={styles.miniPlayer}>
          <Feather
            color={Palette.accent}
            name={miniPlayerStatus.playing ? 'pause' : 'play'}
            size={14}
          />
          <Text style={styles.miniPlayerText}>
            Last take
            <Text style={styles.miniPlayerDuration}>
              {'  ·  ' + formatDuration(lastRecording.durationMs)}
            </Text>
          </Text>
        </Pressable>
      )}

      {/* Record CTA */}
      <View
        style={[
          styles.recordCtaWrap,
          { paddingBottom: bottomInset + 10 },
        ]}>
        <Pressable
          disabled={!hasLyrics}
          onPress={() => void handleRecord()}
          style={({ pressed }) => [
            styles.recordCta,
            !hasLyrics && styles.recordCtaDisabled,
            pressed && styles.recordCtaPressed,
          ]}>
          <Feather
            color={hasLyrics ? Palette.background : Palette.textDisabled}
            name="mic"
            size={17}
          />
          <Text style={[styles.recordCtaText, !hasLyrics && styles.recordCtaTextDisabled]}>
            Start Recording
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Palette.background,
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  missingText: {
    color: Palette.textSecondary,
    fontFamily: 'DM-Sans',
    fontSize: 16,
  },
  nameInput: {
    color: Palette.textPrimary,
    fontFamily: 'DM-Sans-SemiBold',
    fontSize: 18,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  divider: {
    backgroundColor: Palette.border,
    height: StyleSheet.hairlineWidth,
  },
  lyricsContainer: {
    flex: 1,
  },
  lyricsEditInput: {
    color: Palette.textPrimary,
    flex: 1,
    fontFamily: 'DM-Sans',
    fontSize: 16,
    lineHeight: 26,
    paddingBottom: 8,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  lyricsPreviewContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  lyricsPreviewText: {
    color: Palette.textPrimary,
    fontFamily: 'Lora',
    fontSize: 22,
    lineHeight: 37,
  },
  lyricsPreviewPlaceholder: {
    color: Palette.textSecondary,
    fontFamily: 'Lora',
    fontSize: 22,
    lineHeight: 37,
  },
  headerDoneLabel: {
    color: Palette.accent,
    fontFamily: 'DM-Sans-SemiBold',
    fontSize: 16,
  },
  recordCtaWrap: {
    backgroundColor: Palette.background,
    borderTopColor: Palette.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  recordCta: {
    alignItems: 'center',
    backgroundColor: Palette.accent,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 9,
    justifyContent: 'center',
    paddingVertical: 16,
    shadowColor: Palette.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  recordCtaDisabled: {
    backgroundColor: Palette.surfaceRaised,
    shadowOpacity: 0,
  },
  recordCtaPressed: {
    opacity: 0.85,
  },
  recordCtaText: {
    color: Palette.background,
    fontFamily: 'DM-Sans-SemiBold',
    fontSize: 16,
  },
  recordCtaTextDisabled: {
    color: Palette.textDisabled,
  },
  miniPlayer: {
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderTopColor: Palette.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  miniPlayerText: {
    color: Palette.textSecondary,
    fontFamily: 'DM-Sans',
    fontSize: 14,
  },
  miniPlayerDuration: {
    color: Palette.textDisabled,
    fontFamily: 'DM-Sans',
    fontSize: 13,
  },
  headerPencil: {
    padding: 4,
  },
  prefillHelper: {
    color: Palette.textDisabled,
    fontFamily: 'DM-Sans',
    fontSize: 13,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
});
