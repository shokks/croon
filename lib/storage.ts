import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Song } from '@/types';

const SONGS_STORAGE_KEY = 'lyricloop:songs';

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

export { SONGS_STORAGE_KEY };
