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
      const url = links.youtube?.url;
      if (!url) return { opened: false };
      await Linking.openURL(url);
      return { opened: true };
    }

    return { opened: false };
  } catch {
    return { opened: false };
  }
}
