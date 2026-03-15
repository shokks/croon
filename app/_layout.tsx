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
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import 'react-native-reanimated';

import { Palette } from '@/constants/theme';

// Paint the native root window dark before any screen renders — this
// eliminates the white flash that appears during navigation transitions
// when the OS-level background bleeds through semi-transparent screens.
void SystemUI.setBackgroundColorAsync(Palette.background);

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


function LogoHeader() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <LogoIcon width={28} height={28} color={Palette.accent} />
      <Text style={{ fontFamily: 'DM-Sans-SemiBold', fontSize: 18, color: Palette.textPrimary }}>
        SongBuddy
      </Text>
    </View>
  );
}


const SongBuddyTheme = {
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


export default function RootLayout() {
  const [dmSansLoaded] = useDMSansFonts({
    'DM-Sans': DMSans_400Regular,
    'DM-Sans-SemiBold': DMSans_600SemiBold,
  });
  const [loraLoaded] = useLoraFonts({ Lora: Lora_400Regular });
  const fontsLoaded = dmSansLoaded && loraLoaded;

  // Hide the native splash screen only once fonts are ready — prevents
  // the white flash that occurs when the splash auto-hides before the
  // JS bundle has rendered anything.
  useEffect(() => {
    if (fontsLoaded) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    // Splash screen is still visible — returning null here is safe.
    return null;
  }

  return (
    <ThemeProvider value={SongBuddyTheme}>
      <Stack
        screenOptions={({ navigation }) => ({
          headerStyle: { backgroundColor: Palette.surface },
          headerTitleStyle: { fontFamily: 'DM-Sans-SemiBold', color: Palette.textPrimary },
          headerTintColor: Palette.accent,
          headerBackVisible: false,
          headerBackTitleVisible: false,
          // Slide from right on push, slide back from left on pop — standard native nav.
          // Combined with setBackgroundColorAsync above this ensures no white flash.
          animation: 'slide_from_right',
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
    </ThemeProvider>
  );
}
