import { useLocalSearchParams } from 'expo-router';

import { RecordingScreen } from '@/components/RecordingScreen';

export default function SongRecordScreen() {
  const { id, review } = useLocalSearchParams<{ id?: string | string[]; review?: string }>();
  const songId = Array.isArray(id) ? id[0] : (id ?? '');
  const reviewMode = review === 'true';

  return <RecordingScreen reviewMode={reviewMode} songId={songId} />;
}
