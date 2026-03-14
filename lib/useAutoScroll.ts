import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LayoutChangeEvent, NativeSyntheticEvent, NativeScrollEvent, ScrollView } from 'react-native';

import type { ScrollSpeed } from '@/types';

const WPM_BY_SPEED: Record<ScrollSpeed, number> = {
  fast: 300,
  medium: 220,
  slow: 150,
};

const MIN_DURATION_BY_SPEED: Record<ScrollSpeed, number> = {
  fast: 900,
  medium: 1300,
  slow: 1800,
};

const GLOBAL_PACE_FACTOR = 0.4;

type UseAutoScrollOptions = {
  lyrics: string;
  scrollSpeed: ScrollSpeed;
  linesCount: number;
};

export function useAutoScroll({ lyrics, scrollSpeed, linesCount }: UseAutoScrollOptions) {
  const scrollViewRef = useRef<ScrollView>(null);
  const contentHeightRef = useRef(0);
  const viewportHeightRef = useRef(0);
  const currentOffsetRef = useRef(0);
  const startOffsetRef = useRef(0);
  const targetOffsetRef = useRef(0);
  const durationRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const elapsedAtPauseRef = useRef(0);
  const pausedRef = useRef(false);
  const scrollingRef = useRef(false);
  const currentLineRef = useRef(0);

  const [isPaused, setIsPaused] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);

  const estimatedDurationMs = useMemo(() => {
    const characterCount = Math.max(1, lyrics.trim().length);
    const estimatedWords = Math.max(1, Math.ceil(characterCount / 5));
    const wpm = WPM_BY_SPEED[scrollSpeed];
    const readingDurationMs = Math.round((estimatedWords / wpm) * 60_000);
    const tunedDurationMs = Math.round(readingDurationMs * GLOBAL_PACE_FACTOR);
    return Math.max(MIN_DURATION_BY_SPEED[scrollSpeed], tunedDurationMs);
  }, [lyrics, scrollSpeed]);

  const getMaxOffset = useCallback(() => {
    return Math.max(contentHeightRef.current - viewportHeightRef.current, 0);
  }, []);

  const stopAnimation = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Derive which line is centred at a given scroll offset (proportional, no per-line onLayout needed)
  const getLineFromOffset = useCallback((offset: number): number => {
    const maxOffset = getMaxOffset();
    if (maxOffset <= 0 || linesCount <= 1) return 0;
    return Math.min(Math.round((offset / maxOffset) * (linesCount - 1)), linesCount - 1);
  }, [getMaxOffset, linesCount]);

  const animateStep = useCallback(
    (timestamp: number) => {
      if (pausedRef.current || !scrollingRef.current) return;

      if (startedAtRef.current === null) {
        startedAtRef.current = timestamp;
      }

      const elapsed = elapsedAtPauseRef.current + (timestamp - startedAtRef.current);
      const progress = Math.min(elapsed / durationRef.current, 1);

      const nextOffset =
        startOffsetRef.current + (targetOffsetRef.current - startOffsetRef.current) * progress;

      currentOffsetRef.current = nextOffset;
      scrollViewRef.current?.scrollTo({ animated: false, y: nextOffset });

      const newLine = getLineFromOffset(nextOffset);
      if (newLine !== currentLineRef.current) {
        currentLineRef.current = newLine;
        setCurrentLineIndex(newLine);
      }

      if (progress >= 1) {
        scrollingRef.current = false;
        pausedRef.current = false;
        setIsPaused(false);
        setIsScrolling(false);
        stopAnimation();
        return;
      }

      animationFrameRef.current = requestAnimationFrame(animateStep);
    },
    [getLineFromOffset, stopAnimation]
  );

  const startScroll = useCallback((durationMs?: number) => {
    const maxOffset = getMaxOffset();
    const remainingDistance = Math.max(maxOffset - currentOffsetRef.current, 0);
    if (remainingDistance === 0) return false;

    const fullDistance = Math.max(maxOffset, 1);
    const effectiveDuration =
      durationMs ?? Math.max(1000, Math.round(estimatedDurationMs * (remainingDistance / fullDistance)));

    stopAnimation();
    pausedRef.current = false;
    scrollingRef.current = true;
    setIsPaused(false);
    setIsScrolling(true);

    startOffsetRef.current = currentOffsetRef.current;
    targetOffsetRef.current = maxOffset;
    durationRef.current = effectiveDuration;
    elapsedAtPauseRef.current = 0;
    startedAtRef.current = null;

    animationFrameRef.current = requestAnimationFrame(animateStep);
    return true;
  }, [animateStep, estimatedDurationMs, getMaxOffset, stopAnimation]);

  const pauseScroll = useCallback(() => {
    if (!scrollingRef.current || pausedRef.current) return;
    pausedRef.current = true;
    setIsPaused(true);
    setIsScrolling(false);
    if (startedAtRef.current !== null) {
      elapsedAtPauseRef.current += performance.now() - startedAtRef.current;
    }
    stopAnimation();
  }, [stopAnimation]);

  const resumeScroll = useCallback(() => {
    if (!pausedRef.current) return;
    pausedRef.current = false;
    scrollingRef.current = true;
    startedAtRef.current = null;
    setIsPaused(false);
    setIsScrolling(true);
    animationFrameRef.current = requestAnimationFrame(animateStep);
  }, [animateStep]);

  const resetScroll = useCallback(() => {
    stopAnimation();
    pausedRef.current = false;
    scrollingRef.current = false;
    setIsPaused(false);
    setIsScrolling(false);
    setCurrentLineIndex(0);
    currentLineRef.current = 0;
    currentOffsetRef.current = 0;
    elapsedAtPauseRef.current = 0;
    startedAtRef.current = null;
    scrollViewRef.current?.scrollTo({ animated: false, y: 0 });
  }, [stopAnimation]);

  const stopScroll = useCallback(() => {
    stopAnimation();
    pausedRef.current = false;
    scrollingRef.current = false;
    setIsPaused(false);
    setIsScrolling(false);
    elapsedAtPauseRef.current = 0;
    startedAtRef.current = null;
  }, [stopAnimation]);

  useEffect(() => {
    return () => { stopAnimation(); };
  }, [stopAnimation]);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    viewportHeightRef.current = event.nativeEvent.layout.height;
  }, []);

  const onContentSizeChange = useCallback((_width: number, height: number) => {
    contentHeightRef.current = height;
  }, []);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    currentOffsetRef.current = event.nativeEvent.contentOffset.y;
  }, []);

  return {
    currentLineIndex,
    estimatedDurationMs,
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
  };
}
