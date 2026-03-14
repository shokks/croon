import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { type Href, Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
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

import { Palette, withOpacity } from '@/constants/theme';
import { openExternalMusicLink, type MusicProvider } from '@/lib/openExternalMusicLink';
import { deleteSong, getSongs, saveSong } from '@/lib/storage';
import type { ExternalSongLinks, ScrollSpeed, SongRecording } from '@/types';

type SongEditorScreenProps = {
  songId?: string;
  prefillName?: string;
  prefillArtist?: string;
  prefillLyrics?: string;
  lyricsSource?: 'lrclib' | 'manual';
  prefillSyncedLyrics?: string;
  prefillArtworkUrl?: string;
  prefillExternalLinks?: string;
};

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const SPEED_OPTIONS: { label: string; value: ScrollSpeed }[] = [
  { label: 'Ballad', value: 'slow' },
  { label: 'Normal', value: 'medium' },
  { label: 'Uptempo', value: 'fast' },
];

export function SongEditorScreen({
  songId,
  prefillName,
  prefillArtist,
  prefillLyrics,
  lyricsSource,
  prefillSyncedLyrics,
  prefillArtworkUrl,
  prefillExternalLinks,
}: SongEditorScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [artist, setArtist] = useState('');
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
  const artistInputRef = useRef<TextInput>(null);
  const lyricsRef = useRef<TextInput>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs tracking latest values so doSave never captures stale state
  const nameRef = useRef('');
  const artistRef = useRef('');
  const lyricsValueRef = useRef('');
  const scrollSpeedRef = useRef<ScrollSpeed>('medium');
  const lastRecordingRef = useRef<SongRecording | null>(null);
  // True once an existing song has finished loading (new songs start true)
  const isLoadedRef = useRef(!songId);

  // Prefill support (new songs from search)
  const syncedLyricsRef = useRef<string | null>(prefillSyncedLyrics?.trim() || null);
  const artworkUrlRef = useRef<string | null>(prefillArtworkUrl?.trim() || null);
  const externalLinksRef = useRef<ExternalSongLinks | null>((() => {
    if (!prefillExternalLinks) return null;
    try { return JSON.parse(prefillExternalLinks) as ExternalSongLinks; } catch { return null; }
  })());
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
      if (prefillArtist?.trim()) {
        setArtist(prefillArtist.trim());
        artistRef.current = prefillArtist.trim();
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
      setArtist(song.artist ?? '');
      setLyrics(song.lyrics);
      setScrollSpeed(song.scrollSpeed);
      setLastRecording(song.recording ?? null);
      nameRef.current = song.name;
      artistRef.current = song.artist ?? '';
      lyricsValueRef.current = song.lyrics;
      scrollSpeedRef.current = song.scrollSpeed;
      lastRecordingRef.current = song.recording ?? null;
      createdAtRef.current = song.createdAt;
      stableSongId.current = song.id;
      artworkUrlRef.current = song.artworkUrl ?? null;
      syncedLyricsRef.current = song.syncedLyrics ?? null;
      externalLinksRef.current = song.externalLinks ?? null;
      isLoadedRef.current = true;
      setIsLoading(false);
    })();

    return () => {
      mounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- prefill props are stable after mount; doSave is a stable callback
  }, []);

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

  const handleMiniPlayerPress = useCallback(async () => {
    if (!lastRecording?.uri || Platform.OS === 'web') return;
    try {
      if (miniPlayerStatus.playing) {
        miniPlayer.pause();
        await miniPlayer.seekTo(0);
        return;
      }
      if (miniPlayerStatus.didJustFinish) {
        await miniPlayer.seekTo(0);
      }
      miniPlayer.play();
    } catch {
      // silent fail — playback unavailable
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
      artist: artistRef.current.trim() || undefined,
      lyrics: lyricsValueRef.current,
      scrollSpeed: scrollSpeedRef.current,
      createdAt: createdAtRef.current,
      recording: lastRecordingRef.current ?? undefined,
      syncedLyrics: syncedLyricsRef.current ?? undefined,
      artworkUrl: artworkUrlRef.current ?? undefined,
      externalLinks: externalLinksRef.current ?? undefined,
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

  const handleArtistChange = (text: string) => {
    setArtist(text);
    artistRef.current = text;
    scheduleSave();
  };

  const handleLyricsChange = (text: string) => {
    setLyrics(text);
    lyricsValueRef.current = text;
    if (isPrefilled) setIsPrefilled(false);
    scheduleSave();
  };

  const handleScrollSpeedChange = useCallback(
    (speed: ScrollSpeed) => {
      setScrollSpeed(speed);
      scrollSpeedRef.current = speed;
      scheduleSave();
    },
    [scheduleSave]
  );

  const handleDeleteSong = useCallback(() => {
    Alert.alert(
      'Delete song',
      `"${nameRef.current.trim() || 'Untitled song'}" will be permanently deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteSong(stableSongId.current);
            router.replace('/' as Href);
          },
        },
      ]
    );
  }, [router]);

  const handleOpenProvider = useCallback((provider: MusicProvider) => {
    void openExternalMusicLink(provider, { externalLinks: externalLinksRef.current ?? undefined } as Parameters<typeof openExternalMusicLink>[1]).then(({ opened }) => {
      if (!opened) Alert.alert('Link not available for this song.');
    });
  }, []);

  const availableProviders = useMemo<{ provider: MusicProvider; icon: string; color: string }[]>(() => {
    const links = externalLinksRef.current;
    if (!links) return [];
    return [
      links.spotify?.url || links.spotify?.uri
        ? { provider: 'spotify', icon: 'spotify', color: '#1DB954' }
        : null,
      links.appleMusic?.url
        ? { provider: 'appleMusic', icon: 'apple', color: '#FA2D48' }
        : null,
      links.youtube?.url
        ? { provider: 'youtube', icon: 'youtube', color: '#FF0000' }
        : null,
    ].filter(Boolean) as { provider: MusicProvider; icon: string; color: string }[];
  }, []);

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
  ) : songId ? (
    <View style={styles.headerActions}>
      <Pressable hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} onPress={handleDeleteSong} style={styles.headerPencil}>
        <Feather color={Palette.textDisabled} name="trash-2" size={17} />
      </Pressable>
    </View>
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
        onSubmitEditing={() => artistInputRef.current?.focus()}
        placeholder="Song name..."
        placeholderTextColor={Palette.textSecondary}
        returnKeyType="next"
        style={styles.nameInput}
        value={name}
      />

      {/* Artist — subtle secondary field */}
      <TextInput
        blurOnSubmit={false}
        onChangeText={handleArtistChange}
        onSubmitEditing={() => lyricsRef.current?.focus()}
        placeholder="Artist"
        placeholderTextColor={Palette.textDisabled}
        ref={artistInputRef}
        returnKeyType="next"
        style={styles.artistInput}
        value={artist}
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

      {/* Last take mini-player card — only when recording exists and keyboard is hidden */}
      {lastRecording && !isEditing && (
        <Pressable
          onPress={() => void handleMiniPlayerPress()}
          style={({ pressed }) => [styles.miniPlayerCard, pressed && styles.miniPlayerCardPressed]}>
          <View style={styles.miniPlayerIconWrap}>
            <Feather color={Palette.accent} name="headphones" size={18} />
          </View>
          <View style={styles.miniPlayerContent}>
            <Text style={styles.miniPlayerTitle}>Last take</Text>
            <Text style={styles.miniPlayerDuration}>{formatDuration(lastRecording.durationMs)}</Text>
          </View>
          <View style={styles.miniPlayerPlayBtn}>
            <Feather
              color={Palette.accent}
              name={miniPlayerStatus.playing ? 'pause' : 'play'}
              size={20}
            />
          </View>
        </Pressable>
      )}

      {!isEditing && availableProviders.length > 0 ? (
        <View style={styles.providerRow}>
          {availableProviders.map(({ provider, icon, color }) => (
            <Pressable
              key={provider}
              hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
              onPress={() => handleOpenProvider(provider)}
              style={({ pressed }) => [styles.providerBtn, pressed && styles.providerBtnPressed]}>
              <FontAwesome5 color={color} name={icon} size={18} />
            </Pressable>
          ))}
        </View>
      ) : null}

      {/* Bottom bar: speed chips + record CTA */}
      <View style={[styles.bottomBar, { paddingBottom: bottomInset + 10 }]}>
        {!isEditing && (
          <View style={styles.speedRow}>
            {SPEED_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => handleScrollSpeedChange(opt.value)}
                style={[styles.speedChip, scrollSpeed === opt.value && styles.speedChipActive]}>
                <Text style={[styles.speedChipText, scrollSpeed === opt.value && styles.speedChipTextActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

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
            {lastRecording ? 'Record Again' : 'Start Recording'}
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

  // Name + artist inputs
  nameInput: {
    color: Palette.textPrimary,
    fontFamily: 'DM-Sans-SemiBold',
    fontSize: 20,
    paddingBottom: 2,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  artistInput: {
    color: Palette.textSecondary,
    fontFamily: 'DM-Sans',
    fontSize: 14,
    paddingBottom: 14,
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  divider: {
    backgroundColor: Palette.border,
    height: StyleSheet.hairlineWidth,
  },

  // Lyrics
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
    paddingTop: 18,
  },
  lyricsPreviewContent: {
    paddingHorizontal: 22,
    paddingVertical: 22,
  },
  lyricsPreviewText: {
    color: Palette.textPrimary,
    fontFamily: 'Lora',
    fontSize: 22,
    lineHeight: 38,
  },
  lyricsPreviewPlaceholder: {
    color: Palette.textSecondary,
    fontFamily: 'Lora',
    fontSize: 22,
    lineHeight: 38,
  },

  // Prefill helper
  prefillHelper: {
    color: Palette.textDisabled,
    fontFamily: 'DM-Sans',
    fontSize: 13,
    paddingHorizontal: 20,
    paddingVertical: 6,
  },

  // Mini-player card (matches library card language)
  miniPlayerCard: {
    alignItems: 'center',
    backgroundColor: withOpacity(Palette.surfaceRaised, 0.62),
    borderColor: withOpacity(Palette.border, 0.65),
    borderRadius: 14,
    borderWidth: 1,
    elevation: 3,
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
  },
  miniPlayerIconWrap: {
    alignItems: 'center',
    backgroundColor: withOpacity(Palette.accent, 0.1),
    borderRadius: 10,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  miniPlayerContent: {
    flex: 1,
    gap: 2,
  },
  miniPlayerTitle: {
    color: Palette.textPrimary,
    fontFamily: 'DM-Sans-SemiBold',
    fontSize: 14,
  },
  miniPlayerDuration: {
    color: Palette.textDisabled,
    fontFamily: 'DM-Sans',
    fontSize: 12,
  },
  miniPlayerCardPressed: {
    opacity: 0.75,
  },
  miniPlayerPlayBtn: {
    alignItems: 'center',
    borderRadius: 10,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },

  // Bottom bar
  bottomBar: {
    backgroundColor: Palette.background,
    borderTopColor: Palette.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
  },

  // Speed chips (same pill language as library filter chips)
  speedRow: {
    flexDirection: 'row',
    gap: 8,
  },
  speedChip: {
    alignItems: 'center',
    borderColor: Palette.border,
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 7,
  },
  speedChipActive: {
    backgroundColor: withOpacity(Palette.accent, 0.15),
    borderColor: withOpacity(Palette.accent, 0.5),
  },
  speedChipText: {
    color: Palette.textSecondary,
    fontFamily: 'DM-Sans',
    fontSize: 14,
  },
  speedChipTextActive: {
    color: Palette.accent,
    fontFamily: 'DM-Sans-SemiBold',
  },

  // Record CTA
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

  // Header controls
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  headerDoneLabel: {
    color: Palette.accent,
    fontFamily: 'DM-Sans-SemiBold',
    fontSize: 16,
  },
  headerPencil: {
    padding: 4,
  },
  providerRow: {
    flexDirection: 'row',
    gap: 24,
    justifyContent: 'center',
    paddingBottom: 8,
    paddingTop: 2,
  },
  providerBtn: {
    padding: 6,
  },
  providerBtnPressed: {
    opacity: 0.5,
  },
});
