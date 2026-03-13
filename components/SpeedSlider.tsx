import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { ScrollSpeed } from '@/types';

type SpeedSliderProps = {
  value: ScrollSpeed;
  onChange: (value: ScrollSpeed) => void;
};

const SPEED_OPTIONS: { label: string; value: ScrollSpeed }[] = [
  { label: 'Slow', value: 'slow' },
  { label: 'Medium', value: 'medium' },
  { label: 'Fast', value: 'fast' },
];

export function SpeedSlider({ value, onChange }: SpeedSliderProps) {
  return (
    <View style={styles.container}>
      {SPEED_OPTIONS.map((option) => {
        const isSelected = option.value === value;

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.optionButton, isSelected ? styles.optionButtonSelected : undefined]}>
            <ThemedText style={isSelected ? styles.optionLabelSelected : undefined}>
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  optionButton: {
    alignItems: 'center',
    borderColor: '#9CA3AF',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 10,
  },
  optionButtonSelected: {
    backgroundColor: '#0A7EA4',
    borderColor: '#0A7EA4',
  },
  optionLabelSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
