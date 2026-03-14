export type ScrollSpeed = 'slow' | 'medium' | 'fast';

export type ExternalSongLinks = {
  spotify?: {
    uri?: string;
    url?: string;
  };
  appleMusic?: {
    url?: string;
  };
  youtube?: {
    url?: string;
  };
};

export type RecordingState = 'idle' | 'recording' | 'stopped';

export type SongRecording = {
  uri: string;
  durationMs: number;
  recordedAt: string;
};

export type Song = {
  id: string;
  name: string;
  artist?: string;
  lyrics: string;
  scrollSpeed: ScrollSpeed;
  createdAt: string;
  recording?: SongRecording;
  syncedLyrics?: string | null;
  artworkUrl?: string;
  externalLinks?: ExternalSongLinks;
};

export type SongSearchResult = {
  id: number;
  title: string;
  artist: string;
  album: string;
  artworkUrl: string;
  previewUrl: string | null;
  durationMs: number;
  appleMusicUrl: string | null;
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
