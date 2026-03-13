import { Feather } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';

import { Palette } from '@/constants/theme';
import type { RecordingState } from '@/types';

type RecordButtonProps = {
  recordingState: RecordingState;
  onStart: () => void;
  onStop: () => void;
};

export function RecordButton({ recordingState, onStart, onStop }: RecordButtonProps) {
  const pulse = useRef(new Animated.Value(1)).current;
  const ringScale = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (recordingState !== 'recording') {
      pulse.setValue(1);
      ringScale.setValue(1);
      ringOpacity.setValue(0);
      return;
    }

    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { duration: 500, toValue: 1.06, useNativeDriver: true }),
        Animated.timing(pulse, { duration: 500, toValue: 1, useNativeDriver: true }),
      ])
    );

    const ringAnim = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ringScale, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(ringOpacity, { toValue: 0.55, duration: 80, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(ringScale, { toValue: 1.85, duration: 1300, useNativeDriver: true }),
          Animated.timing(ringOpacity, { toValue: 0, duration: 1300, useNativeDriver: true }),
        ]),
        Animated.delay(150),
      ])
    );

    pulseAnim.start();
    ringAnim.start();

    return () => {
      pulseAnim.stop();
      ringAnim.stop();
      pulse.setValue(1);
      ringScale.setValue(1);
      ringOpacity.setValue(0);
    };
  }, [pulse, recordingState, ringScale, ringOpacity]);

  const isRecording = recordingState === 'recording';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isRecording ? 'Stop recording' : 'Start recording'}
      onPress={isRecording ? onStop : onStart}
      style={styles.wrapper}>
      <Animated.View
        style={[
          styles.ring,
          {
            opacity: ringOpacity,
            transform: [{ scale: ringScale }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.button,
          isRecording ? styles.recordingButton : undefined,
          { transform: [{ scale: pulse }] },
        ]}>
        <Feather color={Palette.textPrimary} name={isRecording ? 'square' : 'mic'} size={28} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    height: 80,
    justifyContent: 'center',
    width: 80,
  },
  ring: {
    borderColor: Palette.recordRed,
    borderRadius: 40,
    borderWidth: 1.5,
    height: 80,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 80,
  },
  button: {
    alignItems: 'center',
    backgroundColor: Palette.recordRed,
    borderRadius: 36,
    height: 72,
    justifyContent: 'center',
    shadowColor: Palette.recordRed,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    width: 72,
  },
  recordingButton: {
    backgroundColor: Palette.recordActive,
    borderRadius: 40,
    height: 80,
    shadowColor: Palette.recordActive,
    width: 80,
  },
});
