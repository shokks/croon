import { useLocalSearchParams } from 'expo-router';

import { SongEditorScreen } from '@/components/SongEditorScreen';

export default function NewSongScreen() {
  const { prefillName, prefillArtist, prefillLyrics, lyricsSource, prefillSyncedLyrics, prefillArtworkUrl, prefillExternalLinks } =
    useLocalSearchParams<{
      prefillName?: string;
      prefillArtist?: string;
      prefillLyrics?: string;
      lyricsSource?: 'lrclib' | 'manual';
      prefillSyncedLyrics?: string;
      prefillArtworkUrl?: string;
      prefillExternalLinks?: string;
    }>();

  return (
    <SongEditorScreen
      prefillName={prefillName}
      prefillArtist={prefillArtist}
      prefillLyrics={prefillLyrics}
      lyricsSource={lyricsSource}
      prefillSyncedLyrics={prefillSyncedLyrics}
      prefillArtworkUrl={prefillArtworkUrl}
      prefillExternalLinks={prefillExternalLinks}
    />
  );
}
