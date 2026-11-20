# Spec: Croon Rebuild — "Lyrics That Listen"

**Status:** Draft
**Created:** 2026-11-20
**Replaces:** the v0 MVP app (preserved at git tag `v0-mvp` / branch `legacy/mvp`)
**Keeps:** the problem, the ICP, and everything in [croon.md](../croon.md), [croon-research.md](../croon-research.md), [croon-reddit-research.md](../croon-reddit-research.md) and [design-principles.md](../design-principles.md)
**Spike tasks:** [tasks-rebuild-spikes.md](../tasks/tasks-rebuild-spikes.md)

**Working assumptions:** iOS first · English first · 1–2 developers · no accounts · local-first storage · optimise for a magical experience, not for scale.

---

## 1. Why Rebuild

The v0 MVP proved the shape of the product (paste → scroll → record → share) and set a strong design language. Reviewing it against our own research showed that the most important pain wasn't solved, and that the fix changes the architecture, not just the screens.

### What v0 taught us (from a code review on 2026-11-20)

| # | Finding | Where in v0 |
|---|---|---|
| 1 | **The app never plays the music.** The research's top pain is "voice + music + lyrics in one clip on one phone". v0 records the mic only; users still start Spotify themselves, so the Snapchat-hack problem is unchanged. | `lib/useRecording.ts` |
| 2 | **Synced lyrics share no clock with the music.** The synced-lyrics clock starts when you tap record, not when the song starts in the other app, so the highlighted line is off by however long that gap is. | `components/RecordingScreen.tsx:80` |
| 3 | **Pasted lyrics scroll far too fast.** The pace formula scrolls a 300-word song in ~33s on Normal (~48s on Ballad) against a 3–4 min song. This hits the bring-your-own-lyrics path, which is the original wedge. The track length from iTunes was fetched but never saved. | `lib/useAutoScroll.ts:6-18` |
| 4 | **Takes can disappear.** expo-audio writes recordings to the OS cache folder and they're never moved, so the OS can delete them. On web the saved file link dies on reload. | expo-audio `AudioRecorder.swift:198`, `AudioRecorder.kt:237` |
| 5 | **One take per song.** Re-recording overwrites the previous take, so there's no history or sense of progress. | `lib/storage.ts` `saveRecording` |
| 6 | **The waveform is fake** (a fixed sine pattern), even though expo-audio supports real mic levels. | `components/PostRecordingView.tsx:50` |
| 7 | **Sharing sends a bare .m4a file**, which is the dead end the Share Link PRD describes. | `components/PostRecordingView.tsx:167` |
| 8 | **The emotional product is missing.** The research says people pay to *feel* like a real singer; v0 plays back raw audio. | — |

None of the validation steps in `croon.md` (prototype with 3 people, Reddit posts, the iOS audio-session check) were recorded as done.

### The deciding constraint: where does the music come from?

Our ICP **streams** music. Croon cannot get raw audio or a reliable playback clock from Spotify or Apple Music. Spotify's Developer Policy also explicitly prohibits syncing sound recordings accessed through its platform with lyrics or visual media (see Sources).

So:

- **The music stays in whatever app the user already uses.** Croon doesn't touch it.
- **Lyric timing comes from the one thing Croon controls: the singer's voice** (backed by a tap and, later, by audio that Croon itself plays).
- **Importing an audio file is a bonus path**, not the core loop.

This revises the earlier recommendation to "let Croon play the backing track" as the core: it only works for people who have audio files, which our ICP mostly doesn't.

---

## 2. The Experience, Minute by Minute

The magic moment is not the recording. It is **hearing yourself back and not cringing**, then having something beautiful to send to the people who already love you.

1. **0:00 — "What are you singing?"**
   - There's one field: type a song name or paste lyrics. Search fills in plain lyrics.
   - There's no library on first run, no speed settings and no sync step.
2. **0:15 — The room.**
   - The lyrics fill the screen. A soft glow reacts to your voice, which is the mic check without calling it one.
   - Copy: *"Put your music on however you like. Croon will follow you."*
   - Start Spotify, YouTube, your guitar, or nothing.
3. **0:30 — You sing; the lyrics follow.**
   - The current line is large, and the **next line is always visible**, because singers read ahead.
   - When you pause for a breath or a guitar solo, the lyrics wait. Repeated choruses are handled.
   - If you get lost, **tap any line** and Croon picks up from there. That's the one gesture to re-anchor.
   - On wired headphones you hear yourself in a warm room (live monitoring). This is the confidence trick the incumbents sell.
   - Recording state is always honest: a small red dot while the mic is capturing.
4. **Stop — First playback is already flattering.**
   - The silence at the start and end is trimmed, and the level is evened out and lightly cleaned up.
   - **Room** (a warm reverb) is on by default, with one toggle and no sliders.
   - The lyrics highlight in time with your recorded voice.
5. **Keep — Every take is saved.**
   - "Take 4 · tonight." Star your favourite. Quiet progress over time ("first take vs. today"), never scores.
6. **Share — "Make a clip."**
   - A vertical (9:16) lyric video where the words light up in time with your voice. Background is the artwork or a calm colour, with a small Croon mark.
   - Choose the whole take or **the chorus**, a ~30s clip Croon picked for you.
   - Or **send a link** to the web player (already specced in [spec-croon-share-link-mvp.md](./spec-croon-share-link-mvp.md)).

### Recording modes

| Mode | What's captured | Follower | Notes |
|---|---|---|---|
| **Headphones** (default) | Clean voice only; the music plays privately in your ears | Best | The clip is voice + Room. |
| **Speaker** | Voice and music together, like a phone video | Weaker (music leaks into the mic) | May fall back to tap-to-advance. Closest to what the Snapchat-hack users produced. |
| **Imported track** (later) | Voice, mixed with a track Croon plays itself | Exact (Croon owns the clock) | Only for users who have a file: their own demo, a bought karaoke track. |

---

## 3. The Four Capabilities

### 3.1 The lyric follower (the core bet)

- **Input:** on-device speech recognition streaming the singer's words.
  - Candidates: Apple's **SpeechAnalyzer / SpeechTranscriber** (iOS 26, on-device, quick rough results that refine) or **WhisperKit**. Choose in spike S2; don't commit before.
- **Matcher:** tracks the singer's position in the **known** lyrics. Following known text is far easier than open transcription.
  - Fuzzy and phonetic match of the last few recognised words against the next couple of lines.
  - Moves forward only, except for a search-ahead that handles repeated choruses.
  - A **pace estimate** keeps the highlight moving between matches.
  - A **tap on any line** re-anchors it immediately.
- **Accuracy target:** line-level live. Word-level comes after the take (3.3).
- **Fallback if it fails:** the first take is tap-to-advance; Croon saves those line timings and replays them automatically on every later take ("Croon learns your song").

### 3.2 The native audio engine

- Records the mic **while another app keeps playing**, with an audio session that mixes with other apps.
- **Live monitoring** with Room in the ears where latency allows (wired). Expect Bluetooth to be too slow; there, Room applies on playback only.
- **Polish chain:** cleanup (noise gate / light denoise) → compression → EQ → reverb ("Room").
- Polish is applied at playback and export **without altering the original file**, so the Room toggle costs nothing and can change later.
- Files live in the app's **documents folder**, never the cache.

### 3.3 The post-take aligner

- After you stop, it aligns the lyrics to the clean recorded voice to get **word-by-word timing**. Offline alignment on a clean take is more accurate than the live pass.
- Those timings drive the playback highlight and the video.
- **Chorus detection** from repeated lyric lines powers the auto-picked 30s clip.

### 3.4 The clip renderer

- Builds the 9:16 lyric video **on the phone** and hands it to the share sheet.
- The only backend in v1 is the **share link**: small storage plus a web page, as already specced (Convex + Next.js in `web/`).

---

## 4. Stack

- **UI:** Expo / React Native + Expo Router. The screens, search and library are cheap here and the team already knows the stack.
- **Engine:** one Swift Expo module, **`CroonEngine`**, holding capabilities 3.1–3.4. This is roughly 70% of the hard work.
- **Storage:** local-first. Audio in the documents folder; song and take metadata in a small local store.
- **Lyrics:** user paste, plus LRCLIB search as a convenience (see licensing risks).
- **Backend:** share links only.
- **Android:** after the engine is proven on iOS.

### Data model sketch

```ts
type Song = {
  id: string;
  title: string;
  artist?: string;
  lyrics: string;              // plain text; the source of truth
  artworkUrl?: string;
  learnedLineTimingsMs?: number[]; // from a tap-through or aligned take
  createdAt: string;
};

type Take = {
  id: string;
  songId: string;
  fileName: string;            // relative to the documents folder, never an absolute cache path
  durationMs: number;
  lineTimingsMs: number[];     // live follower, corrected by alignment
  wordTimings?: { lineIndex: number; wordIndex: number; ms: number }[];
  mode: 'headphones' | 'speaker' | 'imported';
  roomOn: boolean;
  starred: boolean;
  recordedAt: string;
};
```

### Carry over from v0

- The design principles and the theme tokens (`constants/theme.ts`): palette, Lora + DM Sans, the calm record-button pulse.
- The LRCLIB lookup approach (search by title, 2s timeout, fail open) as a reference.
- The Share Link spec and PRD.
- The EAS project settings in `app.json` / `eas.json`.

### Cut

- Speed chips and the reading-pace scroll.
- Depending on synced lyric files (plain lyrics are enough).
- The Spotify / Apple Music / YouTube deep-link buttons.
- The hero card and filter chips. The library becomes a list of songs with their takes.
- The fake waveform.
- The record-button-centred flow.
- Any Spotify SDK integration.
- Using iTunes 30s previews as backing tracks.
- The web build of the app and the iTunes dev proxy (iOS first).

---

## 5. Build Order

### Weeks 1–2: spikes (kill or confirm)

Details and checklists live in [tasks-rebuild-spikes.md](../tasks/tasks-rebuild-spikes.md).

| Spike | Pass if… | Fallback that's still good |
|---|---|---|
| **S1. Recording while another app plays.** Wired, AirPods, speaker. This is the unvalidated core risk from `croon.md`. | The music keeps playing at normal quality and the mic is usable. Hypothesis for AirPods: send output to the AirPods and record from the phone's own mic, so the earbuds don't drop to call quality. Test it, don't trust it. | Recommend wired or speaker mode for v1. |
| **S2. Lyric follower.** 10 songs × 3 non-singers, headphones, English. | The right line is lit ≥90% of the time, within ~1s, and it never runs ahead. | Tap-to-advance on the first take; learned timing for every later take. |
| **S3. Live monitoring latency.** | Wired feels natural. Bluetooth is expected to fail. | No live monitoring on Bluetooth; Room on playback only. |
| **S4. Polish A/B.** 5 users, raw vs Room. | They prefer Room and say they would send it. | Keep Room off by default. |

### Weeks 3–6: the core loop

Type → sing → polished playback → takes. Ship on TestFlight to 10–15 people who fit the ICP.

**Measure:**
- Second-take rate in the first session (did they want to sing again?).
- Share rate (did they send something to someone?).

### Weeks 7–9: share

The clip renderer and the share link.

### Later

- Imported tracks (exact timing; music can be mixed into the clip).
- Separating vocals from a track, with a guide-vocal slider (needs a server GPU).
- More languages.
- Android.

---

## 6. Open Risks

- **Following sung lyrics is unproven.** Vibrato, held notes, ad-libs, accents and non-English songs all make it harder. That's why S2 comes first.
- **Speaker mode:** music picked up by the mic hurts the follower, so speaker mode may need tap-to-advance.
- **Bluetooth:** our ICP mostly wears AirPods. Mic quality, the other app's music quality and monitoring latency all change once a record session is active (S1, S3).
- **Lyrics licensing:** LRCLIB isn't licensed. Public share pages showing full lyrics count as public lyric display, which Genius and Musixmatch pay licences for. A 7-day expiry doesn't change that. Consider showing only user-pasted lyrics publicly, or a few lines.
- **Covers in public clips:** clips carrying Croon branding that contain someone else's song need a look before we promote posting them.
- **Platform copying:** TikTok or Instagram could ship a karaoke mode (from `croon.md`). The defence is the private, flattering, follows-you experience, plus each user's library of learned songs and takes.

---

## 7. Decisions Still Open

1. **iOS first?** Recommended: yes.
2. **How much native code?** Recommended: the Expo shell plus one Swift module, not a full native rewrite.
3. **Which languages do the first users sing in?** This decides whether the follower works for them.
4. **Is a voice + Room clip enough for the ICP, or must the music be in the clip?** If the music is a must, the imported-track path moves into v1.

---

## Sources

- [Apple WWDC25: SpeechAnalyzer session](https://developer.apple.com/videos/play/wwdc2025/277/)
- [MacRumors: Apple transcription API speed tests](https://macrumors.com/2025/06/18/apple-transcription-api-faster-than-whisper)
- [Spotify Developer Policy](https://developer.spotify.com/policy/)
- [Spotify: complying with the policy](https://developer.spotify.com/policy/complying/)
