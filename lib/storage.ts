import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ExternalSongLinks, Song, SongRecording } from '@/types';

const SONGS_STORAGE_KEY = 'songbuddy:songs';

function normalizeRecording(value: unknown): SongRecording | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const r = value as Partial<SongRecording>;
  if (typeof r.uri !== 'string' || typeof r.durationMs !== 'number' || typeof r.recordedAt !== 'string') {
    return undefined;
  }
  return { uri: r.uri, durationMs: r.durationMs, recordedAt: r.recordedAt };
}

function normalizeExternalLinks(value: unknown): ExternalSongLinks | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const raw = value as Record<string, unknown>;

  const result: ExternalSongLinks = {};

  if (raw.spotify && typeof raw.spotify === 'object' && !Array.isArray(raw.spotify)) {
    const s = raw.spotify as Record<string, unknown>;
    result.spotify = {
      ...(typeof s.uri === 'string' ? { uri: s.uri } : {}),
      ...(typeof s.url === 'string' ? { url: s.url } : {}),
    };
  }

  if (raw.appleMusic && typeof raw.appleMusic === 'object' && !Array.isArray(raw.appleMusic)) {
    const a = raw.appleMusic as Record<string, unknown>;
    if (typeof a.url === 'string') result.appleMusic = { url: a.url };
  }

  if (raw.youtube && typeof raw.youtube === 'object' && !Array.isArray(raw.youtube)) {
    const y = raw.youtube as Record<string, unknown>;
    if (typeof y.url === 'string') result.youtube = { url: y.url };
  }

  return result;
}

function normalizeSongs(value: unknown): Song[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is Song => {
    if (!item || typeof item !== 'object') {
      return false;
    }

    const candidate = item as Partial<Song>;

    return (
      typeof candidate.id === 'string' &&
      typeof candidate.name === 'string' &&
      typeof candidate.lyrics === 'string' &&
      typeof candidate.scrollSpeed === 'string' &&
      typeof candidate.createdAt === 'string'
    );
  }).map((item) => {
    const candidate = item as Song & { recording?: unknown; syncedLyrics?: unknown; artworkUrl?: unknown; artist?: unknown; externalLinks?: unknown };
    return {
      ...candidate,
      recording: normalizeRecording(candidate.recording),
      syncedLyrics: typeof candidate.syncedLyrics === 'string'
        ? candidate.syncedLyrics
        : undefined,
      artworkUrl: typeof candidate.artworkUrl === 'string'
        ? candidate.artworkUrl
        : undefined,
      artist: typeof candidate.artist === 'string'
        ? candidate.artist
        : undefined,
      externalLinks: normalizeExternalLinks(candidate.externalLinks),
    };
  });
}

export async function getSongs(): Promise<Song[]> {
  try {
    const raw = await AsyncStorage.getItem(SONGS_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;

    return normalizeSongs(parsed).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch {
    return [];
  }
}

export async function saveSong(song: Song): Promise<void> {
  const songs = await getSongs();
  const existingSongIndex = songs.findIndex((currentSong) => currentSong.id === song.id);

  if (existingSongIndex >= 0) {
    songs[existingSongIndex] = song;
  } else {
    songs.unshift(song);
  }

  await AsyncStorage.setItem(SONGS_STORAGE_KEY, JSON.stringify(songs));
}

export async function deleteSong(id: string): Promise<void> {
  const songs = await getSongs();
  const nextSongs = songs.filter((song) => song.id !== id);
  await AsyncStorage.setItem(SONGS_STORAGE_KEY, JSON.stringify(nextSongs));
}

export async function saveRecording(songId: string, recording: SongRecording): Promise<void> {
  const songs = await getSongs();
  const index = songs.findIndex((s) => s.id === songId);
  if (index < 0) return;
  songs[index] = { ...songs[index], recording };
  await AsyncStorage.setItem(SONGS_STORAGE_KEY, JSON.stringify(songs));
}

export { SONGS_STORAGE_KEY };
