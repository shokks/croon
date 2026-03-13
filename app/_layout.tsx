import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import {
  DMSans_400Regular,
  DMSans_600SemiBold,
  useFonts as useDMSansFonts,
} from '@expo-google-fonts/dm-sans';
import { Lora_400Regular, useFonts as useLoraFonts } from '@expo-google-fonts/lora';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import 'react-native-reanimated';

import { Palette, withOpacity } from '@/constants/theme';

function LogoIcon({
  width = 24,
  height = 24,
  color = Palette.accent,
  style,
}: {
  width?: number;
  height?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Svg
      fill="none"
      height={height}
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      style={style}
      viewBox="0 0 24 24"
      width={width}>
      <Path d="M9 18V5l12-2v13" />
      <Path d="M9 9l12-2" />
      <Circle cx={6} cy={18} r={3} />
      <Circle cx={18} cy={16} r={3} />
    </Svg>
  );
}

function VinylRecord({ size, style }: { size: number; style?: StyleProp<ViewStyle> }) {
  const cx = size / 2;
  const cy = size / 2;
  const grooveRadii = Array.from({ length: 16 }, (_, i) => 52 + i * 9);
  return (
    <View style={style}>
      <Svg height={size} viewBox={`0 0 ${size} ${size}`} width={size}>
        <Circle cx={cx} cy={cy} fill="none" r={cx - 4} stroke="#fff" strokeWidth={0.8} />
        {grooveRadii.map((r) => (
          <Circle key={r} cx={cx} cy={cy} fill="none" r={r} stroke="#fff" strokeWidth={0.4} />
        ))}
        <Circle cx={cx} cy={cy} fill="#fff" fillOpacity={0.05} r={44} stroke="#fff" strokeWidth={0.6} />
        <Circle cx={cx} cy={cy} fill="#000" fillOpacity={0.6} r={7} />
      </Svg>
    </View>
  );
}

function LogoHeader() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <LogoIcon width={28} height={28} color={Palette.accent} />
      <Text style={{ fontFamily: 'DM-Sans-SemiBold', fontSize: 18, color: Palette.textPrimary }}>
        LyricLoop
      </Text>
    </View>
  );
}

// Resets on every cold app launch — does not persist across sessions
let splashShown = false;

const LyricLoopTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Palette.background,
    card: Palette.surface,
    text: Palette.textPrimary,
    border: Palette.border,
    notification: Palette.recordRed,
    primary: Palette.accent,
  },
};

function LandingOverlay({ onComplete }: { onComplete: () => void }) {
  const insets = useSafeAreaInsets();

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(14)).current;
  const ruleScaleX = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    splashShown = true;

    Animated.sequence([
      Animated.timing(overlayOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(titleY, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
      Animated.timing(ruleScaleX, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(taglineOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.delay(300),
      Animated.timing(buttonOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [overlayOpacity, titleOpacity, titleY, ruleScaleX, taglineOpacity, buttonOpacity]);

  const handleEnter = useCallback(() => {
    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(overlayOpacity, { toValue: 0, duration: 650, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) onComplete();
    });
  }, [buttonScale, overlayOpacity, onComplete]);

  const bottomPad = Math.max(insets.bottom, 24);

  return (
    <Animated.View style={[landing.container, { opacity: overlayOpacity }]}>
      <View style={landing.glowOuter} />
      <View style={landing.glowInner} />
      <VinylRecord size={400} style={landing.vinyl} />

      <View style={landing.topSpacer} />

      <Animated.View style={{ opacity: titleOpacity, transform: [{ translateY: titleY }] }}>
        <LogoIcon width={48} height={48} color={Palette.accent} style={landing.logo} />
      </Animated.View>

      <Animated.Text
        style={[landing.title, { opacity: titleOpacity, transform: [{ translateY: titleY }] }]}>
        LyricLoop
      </Animated.Text>

      <Animated.View style={[landing.ruleWrap, { transform: [{ scaleX: ruleScaleX }] }]}>
        <View style={landing.rule} />
      </Animated.View>

      <Animated.Text style={[landing.tagline, { opacity: taglineOpacity }]}>
        your voice, your room.
      </Animated.Text>

      <View style={landing.bottomSpacer} />

      <Animated.View
        style={[landing.buttonWrap, { opacity: buttonOpacity, transform: [{ scale: buttonScale }] }]}>
        <Pressable onPress={handleEnter} style={landing.button}>
          <Text style={landing.buttonLabel}>Open my songs</Text>
        </Pressable>
      </Animated.View>

      <View style={{ height: bottomPad + 12 }} />
    </Animated.View>
  );
}

const landing = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: Palette.background,
    zIndex: 999,
  },
  glowOuter: {
    backgroundColor: withOpacity(Palette.accent, 0.028),
    borderRadius: 380,
    height: 760,
    position: 'absolute',
    top: '20%',
    width: 760,
  },
  glowInner: {
    backgroundColor: withOpacity(Palette.accent, 0.062),
    borderRadius: 200,
    height: 400,
    position: 'absolute',
    top: '28%',
    width: 400,
  },
  vinyl: {
    height: 400,
    opacity: 0.1,
    position: 'absolute',
    top: '28%',
    width: 400,
  },
  topSpacer: {
    flex: 1,
  },
  logo: {
    marginBottom: 16,
    marginTop: 48,
  },
  title: {
    color: Palette.textPrimary,
    fontFamily: 'Lora',
    fontSize: 42,
    letterSpacing: 2,
    textAlign: 'center',
  },
  ruleWrap: {
    alignItems: 'center',
    marginVertical: 20,
  },
  rule: {
    backgroundColor: Palette.accent,
    height: 1.5,
    width: 40,
  },
  tagline: {
    color: Palette.textSecondary,
    fontFamily: 'DM-Sans',
    fontSize: 15,
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  bottomSpacer: {
    flex: 1.4,
  },
  buttonWrap: {
    alignSelf: 'stretch',
    marginHorizontal: 32,
  },
  button: {
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderColor: Palette.accentMuted,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 18,
  },
  buttonLabel: {
    color: Palette.accent,
    fontFamily: 'DM-Sans-SemiBold',
    fontSize: 16,
    letterSpacing: 0.2,
  },
});

export default function RootLayout() {
  const [dmSansLoaded] = useDMSansFonts({
    'DM-Sans': DMSans_400Regular,
    'DM-Sans-SemiBold': DMSans_600SemiBold,
  });
  const [loraLoaded] = useLoraFonts({ Lora: Lora_400Regular });
  const [showLanding, setShowLanding] = useState(!splashShown);
  const fontsLoaded = dmSansLoaded && loraLoaded;

  // Hide the native splash screen only once fonts are ready — prevents
  // the white flash that occurs when the splash auto-hides before the
  // JS bundle has rendered anything.
  useEffect(() => {
    if (fontsLoaded) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  const handleLandingComplete = useCallback(() => {
    setShowLanding(false);
  }, []);

  if (!fontsLoaded) {
    // Splash screen is still visible — returning null here is safe.
    return null;
  }

  return (
    <ThemeProvider value={LyricLoopTheme}>
      <Stack
        screenOptions={({ navigation }) => ({
          headerStyle: { backgroundColor: Palette.surface },
          headerTitleStyle: { fontFamily: 'DM-Sans-SemiBold', color: Palette.textPrimary },
          headerTintColor: Palette.accent,
          headerBackVisible: false,
          headerBackTitleVisible: false,
          // Fade matches the spec ("fading feels like the scene changing")
          // and avoids any background-color mismatch flash seen with slides.
          animation: 'fade',
          animationDuration: 200,
          // Fill the content area with the app background during transitions
          // so the brief translucent frame between screens never shows white.
          contentStyle: { backgroundColor: Palette.background },
          headerLeft: ({ canGoBack }) =>
            canGoBack ? (
              <Pressable
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 16 }}
                onPress={() => navigation.goBack()}
                style={{ marginLeft: 4, padding: 4 }}>
                <Feather color={Palette.accent} name="chevron-left" size={26} />
              </Pressable>
            ) : null,
        })}>
        <Stack.Screen name="index" options={{ headerTitle: () => <LogoHeader /> }} />
        <Stack.Screen name="song/search" options={{ title: 'Find a Song' }} />
        <Stack.Screen name="song/new" options={{ title: 'New Song' }} />
        <Stack.Screen name="song/[id]" options={{ title: 'Edit Song' }} />
        <Stack.Screen name="song/record/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="light" />
      {showLanding && <LandingOverlay onComplete={handleLandingComplete} />}
    </ThemeProvider>
  );
}
