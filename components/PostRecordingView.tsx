import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import * as Sharing from 'expo-sharing';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  ImageBackground,
  LayoutChangeEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Palette, withOpacity } from '@/constants/theme';
import { openExternalMusicLink, type MusicProvider } from '@/lib/openExternalMusicLink';
import type { ExternalSongLinks } from '@/types';

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
  artworkUrl?: string;
  externalLinks?: ExternalSongLinks;
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

const PROVIDER_BUTTONS: { provider: MusicProvider; icon: string; color: string }[] = [
  { provider: 'spotify', icon: 'spotify', color: '#1DB954' },
  { provider: 'appleMusic', icon: 'apple', color: '#FA2D48' },
  { provider: 'youtube', icon: 'youtube', color: '#FF0000' },
];

export function PostRecordingView({
  artworkUrl,
  externalLinks,
  initialDurationMs,
  lyrics,
  onBack,
  onEdit,
  onReRecord,
  recordedAt,
  recordingUri,
  songArtist,
  songName,
}: PostRecordingViewProps) {
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
    if (Platform.OS !== 'web') return;

    setIsWebPlaying(false);
    setWebDuration(0);
    setWebCurrentTime(0);
    setWebCanPlay(true);

    if (webAudioRef.current) {
      webAudioRef.current.pause();
      webAudioRef.current = null;
    }

    if (!recordingUri) return;

    const audio = new Audio(recordingUri);
    audio.preload = 'auto';

    const onLoadedMetadata = () => setWebDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onTimeUpdate = () => setWebCurrentTime(audio.currentTime || 0);
    const onPlay = () => setIsWebPlaying(true);
    const onPause = () => setIsWebPlaying(false);
    const onEnded = () => { setIsWebPlaying(false); setWebCurrentTime(0); };
    const onError = () => setWebCanPlay(false);

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
      if (webAudioRef.current === audio) webAudioRef.current = null;
    };
  }, [recordingUri]);

  const handlePlayPress = useCallback(async () => {
    if (!recordingUri) { setErrorMessage('No recording available yet.'); return; }
    try {
      setErrorMessage(null);
      if (Platform.OS === 'web') {
        if (!webCanPlay) { setErrorMessage('Playback unavailable in browser — open on your phone to play.'); return; }
        const webAudio = webAudioRef.current;
        if (!webAudio || webAudio.readyState === 0) { setErrorMessage('Playback unavailable in browser — open on your phone to play.'); return; }
        if (isWebPlaying) { webAudio.pause(); webAudio.currentTime = 0; setWebCurrentTime(0); return; }
        if (webAudio.duration && webAudio.currentTime >= webAudio.duration - 0.01) { webAudio.currentTime = 0; setWebCurrentTime(0); }
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
    try { player.pause(); await player.seekTo(0); } catch {}
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
    try { player.pause(); await player.seekTo(0); } catch {}
    setErrorMessage(null);
    const playerDurationMs = Math.round((Platform.OS === 'web' ? webDuration : playerStatus.duration) * 1000);
    const durationMs = playerDurationMs > 0 ? playerDurationMs : (initialDurationMs ?? 0);
    onBack(recordingUri ?? '', durationMs);
  }, [initialDurationMs, onBack, player, playerStatus.duration, recordingUri, webDuration]);

  const handleOpenProvider = useCallback((provider: MusicProvider) => {
    void openExternalMusicLink(provider, {
      externalLinks,
      name: songName,
      artist: songArtist,
    } as Parameters<typeof openExternalMusicLink>[1]).then(({ opened }) => {
      if (!opened) Alert.alert('Link not available for this song.');
    });
  }, [externalLinks, songName, songArtist]);

  const isPlaying = Platform.OS === 'web' ? isWebPlaying : playerStatus.playing;
  const playerDuration = Platform.OS === 'web' ? webDuration : playerStatus.duration;
  const duration = playerDuration > 0 ? playerDuration : (initialDurationMs ?? 0) / 1000;
  const currentTime = Platform.OS === 'web' ? webCurrentTime : playerStatus.currentTime;
  const playProgress = duration > 0 ? Math.min(currentTime / duration, 1) : 0;

  const MAX_BAR_HEIGHT = 48;
  const bottomInset = Math.max(insets.bottom, 16);
  const hasProviderLinks = externalLinks && (
    externalLinks.spotify?.url ?? externalLinks.appleMusic?.url ?? externalLinks.youtube?.url
  );
  const availableProviderButtons = useMemo(
    () => PROVIDER_BUTTONS.filter(({ provider }) => {
      if (provider === 'spotify') return Boolean(externalLinks?.spotify?.url || externalLinks?.spotify?.uri);
      if (provider === 'appleMusic') return Boolean(externalLinks?.appleMusic?.url);
      if (provider === 'youtube') return Boolean(externalLinks?.youtube?.url);
      return false;
    }),
    [externalLinks]
  );

  return (
    <View style={styles.container}>
      {/* Scrollable content */}
      <ScrollView
        bounces
        contentContainerStyle={{ paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}>

        {/* Hero card */}
        <Pressable onPress={() => void handleBack()} style={styles.heroCard}>
          <ImageBackground
            imageStyle={styles.heroImage}
            source={artworkUrl ? { uri: artworkUrl } : undefined}
            style={[styles.heroArtwork, !artworkUrl && styles.heroArtworkFallback]}>

            {/* Top row: back + edit */}
            <View style={[styles.heroTopRow, { paddingTop: insets.top + 12 }]}>
              <View style={styles.heroBackBtn}>
                <Feather color={Palette.textPrimary} name="chevron-left" size={24} />
              </View>
              {onEdit ? (
                <Pressable
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  onPress={onEdit}
                  style={styles.heroEditBtn}>
                  <Feather color={Palette.textPrimary} name="edit-2" size={17} />
                </Pressable>
              ) : null}
            </View>

            {/* Song info at bottom of hero */}
            <View style={styles.heroOverlay}>
              <Text style={styles.heroEyebrow}>
                {recordedAt ? formatRecordedAt(recordedAt) : 'New Recording'}
              </Text>
              <Text numberOfLines={1} style={styles.heroTitle}>
                {songName || 'Untitled song'}
              </Text>
              {songArtist ? (
                <Text numberOfLines={1} style={styles.heroArtist}>{songArtist}</Text>
              ) : null}
              {duration > 0 ? (
                <View style={styles.heroDurationPill}>
                  <Feather color={withOpacity('#D7CFF2', 0.85)} name="mic" size={11} />
                  <Text style={styles.heroDurationText}>{formatDuration(duration)}</Text>
                </View>
              ) : null}
            </View>
          </ImageBackground>
        </Pressable>

        {/* Waveform card */}
        <View style={styles.waveformCard}>
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

        {/* Lyrics */}
        {lyrics ? (
          <View style={styles.lyricsWrap}>
            <Text style={styles.lyricsText}>{lyrics}</Text>
          </View>
        ) : null}

        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}
      </ScrollView>

      {/* Fixed bottom actions */}
      <View style={[styles.bottomBar, { paddingBottom: bottomInset + 8 }]}>
        {/* Provider logos */}
        {hasProviderLinks ? (
          <View style={styles.providerRow}>
            {availableProviderButtons.map(({ provider, icon, color }) => (
              <Pressable
                key={provider}
                hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
                onPress={() => handleOpenProvider(provider)}
                style={({ pressed }) => [styles.providerBtn, pressed && { opacity: 0.5 }]}>
                <FontAwesome5 color={color} name={icon} size={20} />
              </Pressable>
            ))}
          </View>
        ) : null}

        {/* Sing Again + Share */}
        <View style={styles.actionRow}>
          <Pressable
            onPress={() => void handleReRecord()}
            style={({ pressed }) => [styles.actionBtn, styles.actionBtnSing, pressed && styles.actionBtnPressed]}>
            <Feather color={Palette.accent} name="mic" size={16} />
            <Text style={[styles.actionLabel, styles.actionLabelSing]}>Sing Again</Text>
          </Pressable>

          <Pressable
            onPress={() => void handleSharePress()}
            style={({ pressed }) => [styles.actionBtn, styles.actionBtnSecondary, pressed && styles.actionBtnPressed]}>
            <Feather color={Palette.textSecondary} name="share" size={16} />
            <Text style={styles.actionLabel}>Share</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Palette.background,
    flex: 1,
  },

  // Hero card — same pattern as library hero
  heroCard: {
    marginBottom: 12,
    overflow: 'hidden',
  },
  heroArtwork: {
    aspectRatio: 1,
    backgroundColor: Palette.surfaceRaised,
    justifyContent: 'flex-end',
    width: '100%',
  },
  heroArtworkFallback: {
    backgroundColor: Palette.surface,
  },
  heroImage: {
    // no borderRadius — hero goes edge to edge
  },
  heroTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  heroBackBtn: {
    alignItems: 'center',
    backgroundColor: withOpacity('#000000', 0.35),
    borderRadius: 20,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  heroEditBtn: {
    alignItems: 'center',
    backgroundColor: withOpacity('#000000', 0.35),
    borderRadius: 20,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  heroOverlay: {
    backgroundColor: 'rgba(0,0,0,0.42)',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  heroEyebrow: {
    color: withOpacity('#D7CFF2', 0.85),
    fontFamily: 'DM-Sans-SemiBold',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: Palette.textPrimary,
    fontFamily: 'DM-Sans-SemiBold',
    fontSize: 22,
    lineHeight: 28,
  },
  heroArtist: {
    color: withOpacity(Palette.textPrimary, 0.7),
    fontFamily: 'DM-Sans',
    fontSize: 14,
  },
  heroDurationPill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: withOpacity(Palette.accent, 0.2),
    borderRadius: 20,
    flexDirection: 'row',
    gap: 5,
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  heroDurationText: {
    color: withOpacity('#D7CFF2', 0.85),
    fontFamily: 'DM-Sans-SemiBold',
    fontSize: 12,
  },

  // Waveform card
  waveformCard: {
    backgroundColor: withOpacity(Palette.surfaceRaised, 0.62),
    borderColor: withOpacity(Palette.border, 0.65),
    borderRadius: 16,
    borderWidth: 1,
    elevation: 3,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
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
  lyricsWrap: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  lyricsText: {
    color: Palette.textSecondary,
    fontFamily: 'Lora',
    fontSize: 19,
    lineHeight: 34,
  },

  errorText: {
    color: Palette.recordRed,
    fontFamily: 'DM-Sans',
    fontSize: 13,
    marginTop: 4,
    paddingHorizontal: 16,
    textAlign: 'center',
  },

  // Fixed bottom bar
  bottomBar: {
    backgroundColor: Palette.background,
    borderTopColor: withOpacity(Palette.border, 0.5),
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  // Provider logos row
  providerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 20,
    justifyContent: 'center',
    paddingVertical: 4,
  },
  providerBtn: {
    padding: 6,
  },

  // Action row — matches SongListItem actionsRow exactly
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    alignItems: 'center',
    borderRadius: 14,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 15,
  },
  actionBtnSing: {
    backgroundColor: withOpacity(Palette.accent, 0.12),
  },
  actionBtnSecondary: {
    backgroundColor: withOpacity(Palette.surfaceRaised, 0.9),
    borderColor: withOpacity(Palette.border, 0.8),
    borderWidth: 1,
  },
  actionBtnPressed: {
    opacity: 0.55,
  },
  actionLabel: {
    color: Palette.textSecondary,
    fontFamily: 'DM-Sans-SemiBold',
    fontSize: 15,
  },
  actionLabelSing: {
    color: Palette.accent,
  },
});
