import { useLocalSearchParams } from 'expo-router';

import { SongEditorScreen } from '@/components/SongEditorScreen';

export default function ExistingSongScreen() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const songId = Array.isArray(id) ? id[0] : id;

  return <SongEditorScreen songId={songId} />;
}
