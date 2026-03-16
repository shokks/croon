# PRD: Croon MVP (Expo App)

**Status:** Draft  
**Created:** 2026-03-13  
**Target:** Expo Go (iOS + Android)

---

## 1. Why Are We Building This?

Amateur singers — people who sing for fun, practice originals, or do worship music — have no simple way to record themselves while reading scrolling lyrics on the same screen. The only workarounds are broken: pasting lyrics into a Snapchat chat and screen-recording (iOS kills background audio half the time), or using Smule (paywall for solo recording, no custom lyrics, social overhead).

Croon solves one specific problem: **paste your lyrics, hit record, get an audio clip**. The lyrics scroll automatically while the mic captures your voice. The user plays music separately (Spotify, YouTube) and the app is configured to not interrupt it. The output is a real audio file they can share directly from the app.

No account. No catalog. No strangers. One screen.

---

## 2. Goals

- User can paste/type lyrics and start recording in under 60 seconds
- Auto-scroll runs at a configurable speed so the user never has to touch the screen mid-song
- App does NOT interrupt background audio (iOS audio session set to mix with others)
- Audio clip is exportable via the native share sheet immediately after recording
- Users can save named songs to a local library and return to them instantly

---

## 3. User Stories

**As an amateur singer**, I want to paste my lyrics and have them scroll automatically while I record my voice, so I can focus on singing instead of holding my phone or turning pages.

**As a worship musician**, I want to save a song once with my preferred scroll speed, so I can open it before rehearsal and start recording without any setup.

**As a cover singer**, I want to play backing music from Spotify while the app records my mic, so I get a real audio clip without needing two devices.

**As any user**, I want to tap the screen to pause/resume the scroll mid-song, so I can correct a mistake and keep recording without starting over.

**As any user**, I want to share my recording directly to WhatsApp or iMessage when I'm done, so I can send it to friends immediately.

---

## 4. Functional Requirements

### Lyric Input
1. The app must provide a text input where users can paste or type lyrics of any length.
2. Users must be able to name a song before saving it (e.g., "Amazing Grace — my version").
3. Users must be able to save the current lyrics + scroll speed as a named song to local storage.
4. Users must be able to view a list of saved songs and open any of them.
5. Users must be able to delete saved songs.

### Scrolling
6. When recording starts, lyrics must auto-scroll upward at the configured speed.
7. Users must be able to set scroll speed before recording (e.g., a slider: slow / medium / fast).
8. Users must be able to tap the screen during recording to pause scrolling; tap again to resume.
9. Scroll speed setting must persist per song (saved with the song in local storage).

### Recording
10. Tapping a record button must start mic audio capture.
11. The app must configure the iOS/Android audio session to mix with other audio (so Spotify/YouTube playing in the background is NOT paused when recording starts).
12. Tapping stop must end recording and immediately show a playback + share screen.
13. Recording must capture device mic only (no internal audio mixing required — the user plays music externally).

### Playback & Export
14. After recording stops, the app must allow the user to play back the recording.
15. The app must provide a share button that opens the native OS share sheet with the audio file (`.m4a` or `.mp3`).
16. The app must allow the user to discard the recording and return to lyrics to re-record.

### Navigation
17. The app must have two main screens: **Song Library** (list of saved songs + "New Song" button) and **Song Screen** (lyrics editor + record controls).
18. New users with no saved songs see the Song Screen directly (empty lyrics, ready to use).

---

## 5. Non-Goals (Out of Scope for MVP)

- Video recording or lyrics overlay on video
- In-app background music playback or track import
- Any audio processing: reverb, pitch correction, EQ, effects
- Cloud sync or backend of any kind
- User accounts or authentication
- Social features: sharing to a community, public profiles, duets
- TikTok / Instagram direct post integration (use native share sheet instead)
- Time-synced lyrics (LRC format) — fixed auto-scroll speed only
- Undo/redo in the lyrics editor
- Multiple recordings per song

---

## 6. Design Considerations

- **Single-screen flow**: the Song Screen should show lyrics top, controls bottom — no modals or navigation during recording.
- **Record button**: large, prominent, centered at the bottom. Clear visual state change (idle → recording → stopped).
- **Scroll speed slider**: visible before recording starts, hidden or locked during recording.
- **Tap-to-pause**: full-screen tap target during recording (the lyrics area). Show a subtle "Paused" indicator when scrolling is paused.
- **Minimal chrome**: no hamburger menus, no tabs during recording. The screen should feel like a teleprompter.
- **Post-recording screen**: simple — play button, share button, re-record button. No complex editing.
- Dark mode preferred (easier to read lyrics on stage / in low light).

---

## 7. Technical Considerations

### Expo / React Native
- Use `expo-av` (`Audio.Recording`) for mic capture with `INTERRUPTION_MODE_IOS_MIX_WITH_OTHERS` and `playsInSilentModeIOS: true` — this is the critical config to prevent Spotify from pausing.
- Use `expo-sharing` for the native share sheet.
- Use `@react-native-async-storage/async-storage` (already available via Expo) for local song library.
- Auto-scroll: `Animated.Value` + `Animated.timing` on a `ScrollView` or `FlatList` — tie animation start/pause to recording state.
- Audio file format: `.m4a` (default on iOS, good Android support).

### iOS Audio Session — Critical Risk
The exact failure users experience with the Snapchat hack is iOS killing background audio when recording starts. This must be explicitly solved with:
```ts
await Audio.setAudioModeAsync({
  allowsRecordingIOS: true,
  playsInSilentModeIOS: true,
  interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
  interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
});
```
This must be tested on a real device with Spotify playing before the feature is considered done.

### File-based routing (Expo Router)
Project uses Expo Router. Route structure:
- `/` → Song Library (list of saved songs)
- `/song/[id]` → Song Screen for a saved song
- `/song/new` → Song Screen for a new unsaved song

### Lessons Applied
- **MVP Over-Engineering**: No audio effects, no cloud, no social — happy path only.
- **Goal Clarity Gate**: Core loop is paste → scroll → record → share. Everything else is deferred.

---

## 8. Success Metrics (Real User Feedback)

- 3 beta users complete the full flow (paste lyrics → record → share clip) without asking for help or hitting an error
- At least 1 user plays Spotify in the background while recording with Croon — confirms background audio is NOT killed
- At least 2 users save a song to the library and successfully open it in a second session
- At least 1 user explicitly says "this is easier than my current workaround"
- Zero reports of the recording button doing nothing or the app crashing during record

---

## 9. Open Questions

- Should the app request mic permission proactively on first open, or only when the user taps record? (Recommendation: on first tap — don't ask for permissions you're not immediately using.)
- What happens if the user locks the phone mid-recording? Test whether background audio recording is supported on iOS in Expo Go vs standalone build.
- Should there be a maximum recording length for MVP? (Recommendation: no hard limit — keep it simple.)
- Is Expo Go sufficient for beta testing, or will a dev build be needed for `expo-av` recording? (Check: `expo-av` is available in Expo Go but test on device.)
