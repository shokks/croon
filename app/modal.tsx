import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Palette } from '@/constants/theme';

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Croon</Text>
      <Link href="/" dismissTo style={styles.link}>
        <Text style={styles.linkText}>Go to home screen</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: Palette.background,
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    color: Palette.textPrimary,
    fontFamily: 'Lora',
    fontSize: 28,
    letterSpacing: 1.5,
    marginBottom: 20,
  },
  link: {
    marginTop: 8,
    paddingVertical: 12,
  },
  linkText: {
    color: Palette.accent,
    fontFamily: 'DM-Sans',
    fontSize: 16,
  },
});
