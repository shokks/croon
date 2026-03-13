import { useCallback, useEffect, useRef, useState } from 'react';

import type { ScrollSpeed } from '@/types';

// ms between line advances — tuned to feel like musical beats
const INTERVAL_MS: Record<ScrollSpeed, number> = {
  slow: 6000,    // Ballad ~80 BPM
  medium: 4000,  // Normal ~100 BPM
  fast: 2500,    // Uptempo ~130 BPM
};

type UseAutoScrollOptions = {
  linesCount: number;
  scrollSpeed: ScrollSpeed;
};

export function useAutoScroll({ linesCount, scrollSpeed }: UseAutoScrollOptions) {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentIndexRef = useRef(0);
  const isScrollingRef = useRef(false);
  const isPausedRef = useRef(false);

  const stopInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const scheduleInterval = useCallback(
    (interval: number, count: number) => {
      intervalRef.current = setInterval(() => {
        const next = currentIndexRef.current + 1;
        currentIndexRef.current = next;
        setCurrentLineIndex(next);

        if (next >= count - 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          isScrollingRef.current = false;
          setIsScrolling(false);
        }
      }, interval);
    },
    []
  );

  const startScroll = useCallback(() => {
    if (isScrollingRef.current) return false;
    if (linesCount === 0) return false;
    if (currentIndexRef.current >= linesCount - 1) return false;

    isScrollingRef.current = true;
    isPausedRef.current = false;
    setIsScrolling(true);
    setIsPaused(false);

    scheduleInterval(INTERVAL_MS[scrollSpeed], linesCount);
    return true;
  }, [linesCount, scheduleInterval, scrollSpeed]);

  const pauseScroll = useCallback(() => {
    if (!isScrollingRef.current || isPausedRef.current) return;
    stopInterval();
    isScrollingRef.current = false;
    isPausedRef.current = true;
    setIsScrolling(false);
    setIsPaused(true);
  }, [stopInterval]);

  const resumeScroll = useCallback(() => {
    if (!isPausedRef.current) return;
    if (currentIndexRef.current >= linesCount - 1) return;
    isScrollingRef.current = true;
    isPausedRef.current = false;
    setIsScrolling(true);
    setIsPaused(false);
    scheduleInterval(INTERVAL_MS[scrollSpeed], linesCount);
  }, [linesCount, scheduleInterval, scrollSpeed]);

  const resetScroll = useCallback(() => {
    stopInterval();
    isScrollingRef.current = false;
    isPausedRef.current = false;
    currentIndexRef.current = 0;
    setCurrentLineIndex(0);
    setIsScrolling(false);
    setIsPaused(false);
  }, [stopInterval]);

  const stopScroll = useCallback(() => {
    stopInterval();
    isScrollingRef.current = false;
    isPausedRef.current = false;
    setIsScrolling(false);
    setIsPaused(false);
  }, [stopInterval]);

  useEffect(() => {
    return () => stopInterval();
  }, [stopInterval]);

  return {
    currentLineIndex,
    isPaused,
    isScrolling,
    pauseScroll,
    resetScroll,
    resumeScroll,
    startScroll,
    stopScroll,
  };
}
