import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
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

type LineOffset = { y: number; height: number };

const SCROLL_DURATION = 650; // ms — smooth but not sluggish

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function LyricsScrollView({ lyrics, scrollSpeed, syncedLines, currentMs }: LyricsScrollViewProps) {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  const isSynced = Boolean(syncedLines && syncedLines.length > 0);

  // In synced mode use the synced texts; otherwise split lyrics normally
  const lines = useMemo(
    () => isSynced && syncedLines ? syncedLines.map((l) => l.text) : (lyrics || 'No lyrics.').split('\n'),
    [isSynced, syncedLines, lyrics]
  );

  // In synced mode, derive active index from timestamps
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

  const scrollViewRef = useRef<ScrollView>(null);
  const lineOffsetsRef = useRef<LineOffset[]>([]);
  const viewportHeightRef = useRef(screenHeight);
  const currentScrollYRef = useRef(0);
  const scrollAnimFrameRef = useRef<number | null>(null);

  const {
    currentLineIndex: autoLineIndex,
    isPaused,
    isScrolling,
    pauseScroll,
    resetScroll,
    resumeScroll,
    startScroll,
    stopScroll,
  } = useAutoScroll({ linesCount: lines.length, scrollSpeed });

  // Use timestamp-derived index in synced mode, beat-interval index otherwise
  const currentLineIndex = isSynced ? syncedLineIndex : autoLineIndex;

  const [didStart, setDidStart] = useState(false);

  const smoothScrollTo = (targetY: number) => {
    if (scrollAnimFrameRef.current !== null) {
      cancelAnimationFrame(scrollAnimFrameRef.current);
    }
    const startY = currentScrollYRef.current;
    const distance = targetY - startY;
    if (Math.abs(distance) < 1) return;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / SCROLL_DURATION, 1);
      const eased = easeInOutCubic(t);
      const y = startY + distance * eased;
      scrollViewRef.current?.scrollTo({ y, animated: false });
      if (t < 1) {
        scrollAnimFrameRef.current = requestAnimationFrame(step);
      } else {
        scrollAnimFrameRef.current = null;
      }
    };

    scrollAnimFrameRef.current = requestAnimationFrame(step);
  };

  // Reset when lyrics or speed changes
  useEffect(() => {
    if (scrollAnimFrameRef.current !== null) {
      cancelAnimationFrame(scrollAnimFrameRef.current);
      scrollAnimFrameRef.current = null;
    }
    resetScroll();
    setDidStart(false);
    lineOffsetsRef.current = [];
    currentScrollYRef.current = 0;
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  }, [lyrics, scrollSpeed, resetScroll]);

  useEffect(() => {
    return () => stopScroll();
  }, [stopScroll]);

  // Smooth-scroll to center the active line whenever it advances
  useEffect(() => {
    const lineData = lineOffsetsRef.current[currentLineIndex];
    if (!lineData) return;
    const targetY = Math.max(0, lineData.y - viewportHeightRef.current / 2 + lineData.height / 2);
    smoothScrollTo(targetY);
  }, [currentLineIndex]); // smoothScrollTo uses only refs — stable, safe to omit

  const handleLayout = (event: { nativeEvent: { layout: { height: number } } }) => {
    viewportHeightRef.current = event.nativeEvent.layout.height;
    // In synced mode the scroll is driven by currentMs, not the beat interval
    if (!isSynced && !didStart) {
      if (startScroll()) setDidStart(true);
    }
  };

  const handleTogglePause = () => {
    if (isPaused) {
      resumeScroll();
    } else if (isScrolling) {
      pauseScroll();
    } else {
      startScroll();
    }
  };

  return (
    <Pressable onPress={handleTogglePause} style={styles.container}>
      <ScrollView
        onLayout={handleLayout}
        onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
          currentScrollYRef.current = e.nativeEvent.contentOffset.y;
        }}
        ref={scrollViewRef}
        scrollEnabled={false}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}>

        {/* Top spacer: centers the first line on screen */}
        <View style={{ height: screenHeight / 2 }} />

        {lines.map((line, index) => {
          const isActive = index === currentLineIndex;
          const isPast = index < currentLineIndex;

          // Synced mode: uniform dim for all non-active lines
          // Auto mode: past lines dimmer than future lines
          const lineStyle = isActive
            ? styles.activeLine
            : isSynced
              ? styles.syncedInactiveLine
              : isPast
                ? styles.pastLine
                : styles.futureLine;

          return (
            <View
              key={index}
              onLayout={(e) => {
                lineOffsetsRef.current[index] = {
                  y: e.nativeEvent.layout.y,
                  height: e.nativeEvent.layout.height,
                };
              }}>
              <Text style={[styles.lyricsText, lineStyle]}>
                {line || ' '}
              </Text>
            </View>
          );
        })}

        {/* Bottom spacer: allows last line to scroll to center */}
        <View style={{ height: screenHeight / 2 }} />
      </ScrollView>

      {/* Fixed center guide — subtle horizontal reference line */}
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
