# Tasks: Croon MVP

**PRD:** [docs/tasks/prd-croon-mvp.md](./tasks/prd-croon-mvp.md)  
**Created:** 2026-03-13

---

## Relevant Files

- `app/index.tsx` - Song Library screen (list of saved songs + "New Song" button)
- `app/song/new.tsx` - Song Screen for a brand new unsaved song
- `app/song/[id].tsx` - Song Screen for an existing saved song
- `types/index.ts` - Shared TypeScript types (Song, ScrollSpeed, RecordingState)
- `lib/storage.ts` - AsyncStorage CRUD helpers for the song library
- `lib/useRecording.ts` - Custom hook wrapping expo-av recording logic
- `lib/useAutoScroll.ts` - Custom hook for Animated scroll engine
- `components/SongListItem.tsx` - Single row in the song library list
- `components/LyricsScrollView.tsx` - Animated ScrollView that displays scrolling lyrics
- `components/SpeedSlider.tsx` - Scroll speed control (slow / medium / fast)
- `components/RecordButton.tsx` - Large record/stop button with visual state changes
- `components/PostRecordingView.tsx` - Playback + share + re-record controls shown after stop
- `app.json` - Expo config (microphone permission strings)

### Notes

- No automated tests for MVP — validate manually on a real device.
- All state is local; no backend, no auth, no network calls.
- Always test audio session behaviour (Spotify not pausing) on a **real device**, not the simulator.
- If any correction or lesson is discovered during implementation, add project-specific ones to `docs/lessons.md`.

---

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, check it off by changing `- [ ]` to `- [x]`. Update after each sub-task, not just each parent task.

After each sub-task completion, run the most relevant validation for that sub-task (on-device checks whenever applicable), then mark it completed.

**Do not proceed to the next parent task until the user explicitly confirms the current task works.**

Each parent task follows this lifecycle:
1. Create a dedicated branch for that task
2. Implement the sub-tasks
3. Verify it works
4. Get user approval
5. Commit, merge to main, delete the branch
6. Start the next task on a fresh branch

---

## Tasks

- [x] 1.0 Install dependencies & configure project
  - [x] 1.1 Create and checkout branch: `git checkout -b feature/1-project-setup` (~5 min)
  - [x] 1.2 Install `expo-av`: `npx expo install expo-av` (~10 min)
  - [x] 1.3 Install `expo-sharing`: `npx expo install expo-sharing` (~5 min)
  - [x] 1.4 Install `@react-native-async-storage/async-storage`: `npx expo install @react-native-async-storage/async-storage` (~5 min)
  - [x] 1.5 Add microphone permission strings to `app.json` under `ios.infoPlist` (`NSMicrophoneUsageDescription`) and `android.permissions` (`RECORD_AUDIO`) (~15 min)
  - [x] 1.6 Create `types/index.ts` with shared types: `Song` (id, name, lyrics, scrollSpeed, createdAt), `ScrollSpeed` (`'slow' | 'medium' | 'fast'`), `RecordingState` (`'idle' | 'recording' | 'stopped'`) (~15 min)
  - [x] 1.7 Verify: `npx expo start` runs without errors; all packages resolve in Expo Go on device (~10 min)
  - [x] 1.8 Get user approval
  - [x] 1.9 Commit changes, merge `feature/1-project-setup` to `main`, delete branch (~10 min)

- [x] 2.0 Build local song library (storage layer + library screen)
  - [x] 2.1 Create and checkout branch: `git checkout -b feature/2-song-library` (~5 min)
  - [x] 2.2 Create `lib/storage.ts` with AsyncStorage helpers: `getSongs()`, `saveSong(song)`, `deleteSong(id)` — songs stored as a JSON array under a single key (~30 min)
  - [x] 2.3 Create `components/SongListItem.tsx` — shows song name + created date, with a delete icon button (~30 min)
  - [x] 2.4 Build `app/index.tsx` as the library screen: fetch songs on mount, render a `FlatList` of `SongListItem`, show an empty-state message ("No songs yet — tap + to start") when list is empty (~45 min)
  - [x] 2.5 Add a prominent "+" button in the header that navigates to `/song/new` (~15 min)
  - [x] 2.6 Wire delete: call `deleteSong(id)` then refresh the list (~15 min)
  - [x] 2.7 Verify: manually seed a song in storage — confirm it appears in the list; delete it — confirm it disappears; confirm empty state shows on a fresh install (~15 min)
  - [x] 2.8 Get user approval
  - [x] 2.9 Commit changes, merge `feature/2-song-library` to `main`, delete branch (~10 min)

- [x] 3.0 Build Song Screen UI (lyrics editor + scroll speed + save)
  - [x] 3.1 Create and checkout branch: `git checkout -b feature/3-song-screen-ui` (~5 min)
  - [x] 3.2 Create `app/song/new.tsx` and `app/song/[id].tsx` — the `[id]` route loads the existing song from storage on mount; both share the same UI structure (~30 min)
  - [x] 3.3 Add a song name `TextInput` at the top of the Song Screen (~15 min)
  - [x] 3.4 Add a multiline `TextInput` for lyrics that fills the available vertical space (~20 min)
  - [x] 3.5 Create `components/SpeedSlider.tsx` — a 3-step control (Slow / Medium / Fast) as three tappable buttons; default to Medium (~30 min)
  - [x] 3.6 Add a "Save" button that calls `saveSong()` with current name + lyrics + speed; navigate back to library after save (~20 min)
  - [x] 3.7 Hide the speed slider and name/lyrics inputs when `recordingState !== 'idle'` (screen switches to teleprompter mode during recording) (~15 min)
  - [x] 3.8 Verify: type lyrics, set speed, save — song appears in library; open saved song — name/lyrics/speed all restored correctly (~15 min)
  - [x] 3.9 Get user approval
  - [x] 3.10 Commit changes, merge `feature/3-song-screen-ui` to `main`, delete branch (~10 min)

- [x] 4.0 Implement auto-scroll engine
  - [x] 4.1 Create and checkout branch: `git checkout -b feature/4-auto-scroll` (~5 min)
  - [x] 4.2 Create `lib/useAutoScroll.ts` — returns `scrollViewRef`, `startScroll(durationMs)`, `pauseScroll()`, `resumeScroll()`, `resetScroll()` (~45 min)
  - [x] 4.3 Calculate scroll duration from lyrics character count and selected speed: Slow ≈ 60 wpm, Medium ≈ 90 wpm, Fast ≈ 120 wpm; compute total pixel height to scroll and derive duration accordingly (~30 min)
  - [x] 4.4 Create `components/LyricsScrollView.tsx` — renders lyrics in a large readable font inside a `ScrollView` driven by the hook; tap anywhere on the lyrics area to toggle pause/resume (~45 min)
  - [x] 4.5 Show a subtle "⏸ Paused" badge overlaid on the lyrics when scrolling is paused (~15 min)
  - [x] 4.6 Call `resetScroll()` when user taps "Re-record" to snap back to the top (~10 min)
  - [x] 4.7 Verify: trigger scroll manually — confirm it runs at all three speeds; tap to pause and resume; tap re-record to confirm reset to top (~20 min)
  - [x] 4.8 Get user approval
  - [x] 4.9 Commit changes, merge `feature/4-auto-scroll` to `main`, delete branch (~10 min)

- [x] 5.0 Implement audio recording with correct iOS/Android audio session
  - [x] 5.1 Create and checkout branch: `git checkout -b feature/5-recording` (~5 min)
  - [x] 5.2 Create `lib/useRecording.ts` — wraps `expo-av` `Audio.Recording`; exposes `startRecording()`, `stopRecording()` (returns URI), `recordingState` (~45 min)
  - [x] 5.3 Inside `startRecording()`, call `Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true, interruptionModeIOS: InterruptionModeIOS.MixWithOthers, interruptionModeAndroid: InterruptionModeAndroid.DoNotMix })` **before** starting the recording — this is the critical iOS fix (~20 min)
  - [x] 5.4 Request mic permission (`Audio.requestPermissionsAsync()`) on first tap of record; show a simple error message if denied (~20 min)
  - [x] 5.5 Create `components/RecordButton.tsx` — large circular button; idle = red mic icon, recording = pulsing red stop icon; calls `startRecording` / `stopRecording` on press (~30 min)
  - [x] 5.6 Wire `RecordButton` to `useAutoScroll`: `startRecording` → `startScroll`, `stopRecording` → stop scroll and transition to post-recording view (~20 min)
  - [x] 5.7 Verify **on a real device**: start Spotify, open Croon, tap record — confirm Spotify keeps playing; tap stop — confirm a recording URI is returned (~20 min)
  - [x] 5.8 Get user approval
  - [x] 5.9 Commit changes, merge `feature/5-recording` to `main`, delete branch (~10 min)

- [x] 6.0 Build post-recording screen (playback + share + re-record)
  - [x] 6.1 Create and checkout branch: `git checkout -b feature/6-post-recording` (~5 min)
  - [x] 6.2 Create `components/PostRecordingView.tsx` — shown in place of the record button after `stopRecording`; contains Play, Share, and Re-record buttons (~30 min)
  - [x] 6.3 Implement playback: use `Audio.Sound.createAsync(uri)` + `sound.playAsync()` / `sound.stopAsync()`; show a playing indicator while audio is playing (~30 min)
  - [x] 6.4 Implement share: call `Sharing.shareAsync(uri)` to open the native OS share sheet with the `.m4a` file (~20 min)
  - [x] 6.5 Implement re-record: stop any playback, unload sound, clear the recording URI, reset scroll position, return to idle state (~20 min)
  - [x] 6.6 Verify: playback plays the recorded audio; share sheet opens with the file and can be sent via iMessage/WhatsApp; re-record resets the screen cleanly (~20 min)
  - [x] 6.7 Get user approval
  - [x] 6.8 Commit changes, merge `feature/6-post-recording` to `main`, delete branch (~10 min)

- [ ] 7.0 Wire navigation end-to-end and validate full user flow
  - [x] 7.1 Create and checkout branch: `git checkout -b feature/7-e2e-validation` (~5 min)
  - [x] 7.2 Ensure first-time users (no saved songs) land directly on `/song/new` — redirect in `app/index.tsx` if `songs.length === 0` (~15 min)
  - [x] 7.3 Ensure the back button from Song Screen goes to the library without silently losing unsaved lyrics (prompt "Save before leaving?" or auto-save draft) (~20 min)
  - [x] 7.4 Walk through the full happy path on device: open app → paste lyrics → set speed → tap record → sing → tap stop → play back → share → re-record → save song → find it in library (~20 min)
  - [x] 7.5 Test with Spotify playing throughout — confirm it never pauses at any point in the flow (~15 min)
  - [x] 7.6 Fix any layout issues on small screens (iPhone SE) and confirm lyrics are readable in low light (~20 min)
  - [x] 7.7 Verify all PRD success metrics: 3 flows completed without confusion, Spotify stays active, saved song reopens correctly, share works end-to-end (~15 min)
  - [x] 7.8 Get user approval
  - [x] 7.9 Commit changes, merge `feature/7-e2e-validation` to `main`, delete branch (~10 min)
