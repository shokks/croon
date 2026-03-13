import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Palette, withOpacity } from '@/constants/theme';
import { useAutoScroll } from '@/lib/useAutoScroll';
import type { ScrollSpeed } from '@/types';

type LyricsScrollViewProps = {
  lyrics: string;
  scrollSpeed: ScrollSpeed;
};

export function LyricsScrollView({ lyrics, scrollSpeed }: LyricsScrollViewProps) {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  const {
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
  } = useAutoScroll({ lyrics, scrollSpeed });

  const [didAutoStart, setDidAutoStart] = useState(false);

  useEffect(() => {
    resetScroll();
    setDidAutoStart(false);
  }, [lyrics, scrollSpeed, resetScroll]);

  useEffect(() => {
    return () => {
      stopScroll();
    };
  }, [stopScroll]);

  const handleTogglePause = () => {
    if (isPaused) {
      resumeScroll();
      return;
    }
    if (!isScrolling) {
      startScroll();
      return;
    }
    pauseScroll();
  };

  const handleContentSizeChange = (width: number, height: number) => {
    onContentSizeChange(width, height);
    if (didAutoStart) return;
    if (startScroll()) setDidAutoStart(true);
  };

  const handleLayout = (event: Parameters<typeof onLayout>[0]) => {
    onLayout(event);
    if (didAutoStart) return;
    if (startScroll()) setDidAutoStart(true);
  };

  return (
    <Pressable onPress={handleTogglePause} style={styles.container}>
      <ScrollView
        onContentSizeChange={handleContentSizeChange}
        onLayout={handleLayout}
        onScroll={onScroll}
        ref={scrollViewRef}
        scrollEnabled={false}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}>
        <Text style={[styles.lyricsText, { paddingTop: insets.top + 20, paddingBottom: screenHeight }]}>
          {lyrics || 'No lyrics.'}
        </Text>
      </ScrollView>

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
    color: Palette.textPrimary,
    fontFamily: 'Lora',
    fontSize: 24,
    lineHeight: 41,
    paddingHorizontal: 24,
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
