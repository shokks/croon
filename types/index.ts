export type ScrollSpeed = 'slow' | 'medium' | 'fast';

export type RecordingState = 'idle' | 'recording' | 'stopped';

export type SongRecording = {
  uri: string;
  durationMs: number;
  recordedAt: string;
};

export type Song = {
  id: string;
  name: string;
  lyrics: string;
  scrollSpeed: ScrollSpeed;
  createdAt: string;
  recording?: SongRecording;
  syncedLyrics?: string | null;
  artworkUrl?: string;
};

export type SongSearchResult = {
  id: number;
  title: string;
  artist: string;
  album: string;
  artworkUrl: string;
  previewUrl: string | null;
  durationMs: number;
};

export type LyricsLookupResult = {
  plainLyrics: string | null;
  syncedLyrics: string | null;
  source: 'lrclib' | 'manual';
};

export type SyncedLyricLine = {
  ms: number;
  text: string;
};
