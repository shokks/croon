import { useLocalSearchParams } from 'expo-router';

import { SongEditorScreen } from '@/components/SongEditorScreen';

export default function NewSongScreen() {
  const { prefillName, prefillLyrics, lyricsSource, prefillSyncedLyrics, prefillArtworkUrl } =
    useLocalSearchParams<{
      prefillName?: string;
      prefillLyrics?: string;
      lyricsSource?: 'lrclib' | 'manual';
      prefillSyncedLyrics?: string;
      prefillArtworkUrl?: string;
    }>();

  return (
    <SongEditorScreen
      prefillName={prefillName}
      prefillLyrics={prefillLyrics}
      lyricsSource={lyricsSource}
      prefillSyncedLyrics={prefillSyncedLyrics}
      prefillArtworkUrl={prefillArtworkUrl}
    />
  );
}
