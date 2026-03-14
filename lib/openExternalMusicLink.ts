import { Linking } from 'react-native';

import type { Song } from '@/types';

export type MusicProvider = 'spotify' | 'appleMusic' | 'youtube';

function resolveUrl(provider: MusicProvider, song: Song): string | null {
  const links = song.externalLinks;
  if (!links) return null;

  switch (provider) {
    case 'spotify':
      return links.spotify?.uri ?? links.spotify?.url ?? null;
    case 'appleMusic':
      return links.appleMusic?.url ?? null;
    case 'youtube':
      return links.youtube?.url ?? null;
  }
}

export async function openExternalMusicLink(
  provider: MusicProvider,
  song: Song
): Promise<{ opened: boolean }> {
  const url = resolveUrl(provider, song);
  if (!url) return { opened: false };

  try {
    await Linking.openURL(url);
    return { opened: true };
  } catch {
    return { opened: false };
  }
}
