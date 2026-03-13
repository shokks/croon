import type { SyncedLyricLine } from '@/types';

const LRC_LINE_RE = /^\[(\d{2}):(\d{2})\.(\d{2,3})\]\s*(.*)$/;

export function parseSyncedLyrics(lrc: string | null): SyncedLyricLine[] {
  if (!lrc) return [];

  const lines: SyncedLyricLine[] = [];

  for (const raw of lrc.split('\n')) {
    const match = LRC_LINE_RE.exec(raw.trim());
    if (!match) continue;

    const mm = parseInt(match[1], 10);
    const ss = parseInt(match[2], 10);
    const xx = match[3];
    // 2-digit fractional = centiseconds (×10), 3-digit = milliseconds
    const ms = mm * 60_000 + ss * 1_000 + (xx.length === 3 ? parseInt(xx, 10) : parseInt(xx, 10) * 10);
    const text = match[4].trim();

    lines.push({ ms, text });
  }

  return lines.sort((a, b) => a.ms - b.ms);
}
