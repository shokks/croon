import { Linking, Platform } from 'react-native';

import type { Song } from '@/types';

export type MusicProvider = 'spotify' | 'appleMusic' | 'youtube';

export async function openExternalMusicLink(
  provider: MusicProvider,
  song: Song
): Promise<{ opened: boolean }> {
  const links = song.externalLinks;
  if (!links) return { opened: false };

  try {
    if (provider === 'spotify') {
      const uri = links.spotify?.uri;
      const url = links.spotify?.url;
      if (!uri && !url) return { opened: false };
      // On web, custom URI schemes silently do nothing — go straight to the web URL.
      // On native, try the app URI first; fall back to web URL if the app is not installed.
      if (uri && Platform.OS !== 'web') {
        try {
          await Linking.openURL(uri);
          return { opened: true };
        } catch {
          // Spotify app not installed — fall through to web URL
        }
      }
      if (url) {
        await Linking.openURL(url);
        return { opened: true };
      }
      return { opened: false };
    }

    if (provider === 'appleMusic') {
      const url = links.appleMusic?.url;
      if (!url) return { opened: false };
      await Linking.openURL(url);
      return { opened: true };
    }

    if (provider === 'youtube') {
      if (!links.youtube) return { opened: false };
      // Always reconstruct the YouTube URL from the song's name + artist fields.
      // The stored url can be corrupted (& in artist names truncates it during
      // Expo Router param serialisation). Song.name and Song.artist are always safe.
      const ytArtist = (song.artist ?? '')
        .split(',')[0]
        .replace(/\s*&\s*/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      const ytTitle = (song.name ?? '').trim();
      const ytQuery = [ytArtist, ytTitle].filter(Boolean).join(' ');
      if (!ytQuery) return { opened: false };
      await Linking.openURL(
        `https://www.youtube.com/results?search_query=${encodeURIComponent(ytQuery)}`
      );
      return { opened: true };
    }

    return { opened: false };
  } catch {
    return { opened: false };
  }
}
