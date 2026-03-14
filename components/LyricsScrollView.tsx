import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Palette, withOpacity } from '@/constants/theme';
import { useAutoScroll } from '@/lib/useAutoScroll';
import type { ScrollSpeed, SyncedLyricLine } from '@/types';

type LyricsScrollViewProps = {
  lyrics: string;
  scrollSpeed: ScrollSpeed;
  syncedLines?: SyncedLyricLine[];
  currentMs?: number;
};

export function LyricsScrollView({ lyrics, scrollSpeed, syncedLines, currentMs }: LyricsScrollViewProps) {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  const isSynced = Boolean(syncedLines && syncedLines.length > 0);

  const lines = useMemo(
    () => isSynced && syncedLines
      ? syncedLines.map((l) => l.text)
      : (lyrics || 'No lyrics.').split('\n'),
    [isSynced, syncedLines, lyrics]
  );

  // Synced mode: derive active line index from timestamps
  const syncedLineIndex = useMemo(() => {
    if (!isSynced || !syncedLines || syncedLines.length === 0) return 0;
    const ms = currentMs ?? 0;
    let idx = 0;
    for (let i = 0; i < syncedLines.length; i++) {
      if (syncedLines[i].ms <= ms) idx = i;
      else break;
    }
    return idx;
  }, [isSynced, syncedLines, currentMs]);

  const {
    currentLineIndex: autoLineIndex,
    isPaused,
    isScrolling,
    onContentSizeChange,
    onLayout,
    onScroll,
    pauseScroll,
    resetScroll,
    resumeScroll,
    scrollViewRef,
    startScroll,
    stopScroll,
  } = useAutoScroll({ lyrics, scrollSpeed, linesCount: lines.length });

  // In synced mode use timestamps, otherwise use continuous-scroll-derived index
  const currentLineIndex = isSynced ? syncedLineIndex : autoLineIndex;

  const [didStart, setDidStart] = useState(false);
  const contentHeightRef = useRef(0);
  const viewportHeightRef = useRef(screenHeight);
  const startRetryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearStartRetry = useCallback(() => {
    if (startRetryRef.current) {
      clearTimeout(startRetryRef.current);
      startRetryRef.current = null;
    }
  }, []);

  const tryStartAutoScroll = useCallback(() => {
    if (isSynced || didStart) return;
    const contentHeight = contentHeightRef.current;
    const viewportHeight = viewportHeightRef.current;
    if (viewportHeight <= 0 || contentHeight <= viewportHeight) {
      clearStartRetry();
      startRetryRef.current = setTimeout(() => {
        tryStartAutoScroll();
      }, 120);
      return;
    }
    if (startScroll()) setDidStart(true);
  }, [clearStartRetry, didStart, isSynced, startScroll]);

  useEffect(() => {
    resetScroll();
    setDidStart(false);
    clearStartRetry();
  }, [clearStartRetry, lyrics, scrollSpeed, resetScroll]);

  useEffect(() => {
    return () => {
      clearStartRetry();
      stopScroll();
    };
  }, [clearStartRetry, stopScroll]);

  useEffect(() => {
    if (isSynced || didStart) return;
    const id = requestAnimationFrame(() => {
      tryStartAutoScroll();
    });
    return () => cancelAnimationFrame(id);
  }, [didStart, isSynced, lines.length, tryStartAutoScroll]);

  // Synced mode: scroll to the active line whenever syncedLineIndex changes
  useEffect(() => {
    if (!isSynced) return;
    const maxOffset = Math.max(contentHeightRef.current - viewportHeightRef.current, 0);
    if (maxOffset <= 0 || lines.length <= 1) return;
    // Proportional: line i centred at (i+0.5)/(N) of maxOffset
    const targetY = Math.max(0, ((syncedLineIndex + 0.5) / lines.length) * maxOffset);
    scrollViewRef.current?.scrollTo({ y: targetY, animated: true });
  }, [isSynced, syncedLineIndex, lines.length, scrollViewRef]);

  const handleContentSizeChange = (width: number, height: number) => {
    contentHeightRef.current = height;
    onContentSizeChange(width, height);
    tryStartAutoScroll();
  };

  const handleLayout = (event: Parameters<typeof onLayout>[0]) => {
    viewportHeightRef.current = event.nativeEvent.layout.height;
    onLayout(event);
    tryStartAutoScroll();
  };

  const handleTogglePause = () => {
    if (isSynced) return;
    if (isPaused) {
      resumeScroll();
    } else if (isScrolling) {
      pauseScroll();
    } else {
      if (startScroll()) setDidStart(true);
    }
  };

  return (
    <Pressable onPress={handleTogglePause} style={styles.container}>
      <ScrollView
        onContentSizeChange={handleContentSizeChange}
        onLayout={handleLayout}
        onScroll={onScroll}
        ref={scrollViewRef}
        scrollEnabled
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}>

        <View style={{ height: screenHeight / 2 }} />

        {lines.map((line, index) => {
          const isActive = index === currentLineIndex;
          const isPast = index < currentLineIndex;
          const lineStyle = isActive
            ? styles.activeLine
            : isSynced
              ? styles.syncedInactiveLine
              : isPast
                ? styles.pastLine
                : styles.futureLine;

          return (
            <View key={index}>
              <Text style={[styles.lyricsText, lineStyle]}>
                {line || ' '}
              </Text>
            </View>
          );
        })}

        <View style={{ height: screenHeight / 2 }} />
      </ScrollView>

      <View
        pointerEvents="none"
        style={[styles.centerGuide, { top: screenHeight / 2 - 1 }]}
      />

      {isPaused ? (
        <View style={[styles.pauseBadge, { top: insets.top + 16 }]}>
          <Text style={styles.pauseLabel}>⏸</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  lyricsText: {
    fontFamily: 'Lora',
    fontSize: 24,
    lineHeight: 41,
    paddingHorizontal: 28,
    paddingVertical: 6,
  },
  pastLine: {
    color: withOpacity(Palette.textPrimary, 0.22),
  },
  activeLine: {
    color: Palette.textPrimary,
  },
  futureLine: {
    color: withOpacity(Palette.textPrimary, 0.55),
  },
  syncedInactiveLine: {
    color: withOpacity(Palette.textPrimary, 0.4),
  },
  centerGuide: {
    backgroundColor: withOpacity(Palette.accent, 0.12),
    height: 2,
    left: 28,
    position: 'absolute',
    right: 28,
  },
  pauseBadge: {
    backgroundColor: withOpacity(Palette.accent, 0.18),
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    position: 'absolute',
    right: 16,
  },
  pauseLabel: {
    color: Palette.accent,
    fontFamily: 'DM-Sans',
    fontSize: 14,
  },
});
