# Spec: Croon Rebuild — "Lyrics That Listen"

**Status:** Draft
**Created:** 2026-11-20
**Replaces:** the v0 Expo MVP (preserved at git tag `v0-mvp` / branch `legacy/mvp`)
**Keeps:** the problem and ICP in [croon.md](../croon.md), the research in [croon-research.md](../croon-research.md) and [croon-reddit-research.md](../croon-reddit-research.md), and [design-principles.md](../design-principles.md)
**Spike tasks:** [tasks-rebuild-spikes.md](../tasks/tasks-rebuild-spikes.md)

## Decisions (2026-11-20)

| Question | Decision |
|---|---|
| Platform | **iOS first.** Android later, once the engine is proven. |
| Stack | **Fully native:** Swift + SwiftUI. No Expo / React Native. |
| Languages | **English and Hindi** from v1. |
| Music in the clip | **Yes.** The shared clip must contain the music, not just the voice. |

**Other working assumptions:** 1–2 developers · no accounts · local-first storage · optimise for a magical experience, not for scale.

---

## 1. Why Rebuild

The v0 MVP proved the shape of the product (paste → scroll → record → share) and set a strong design language. Reviewing it against our own research showed that the most important pain wasn't solved, and that the fix changes the architecture, not just the screens.

### What v0 taught us (code review, 2026-11-20)

| # | Finding | Where in v0 (paths at tag `v0-mvp`) |
|---|---|---|
| 1 | **The app never plays the music.** The research's top pain is "voice + music + lyrics in one clip on one phone". v0 records the mic only; users still start Spotify themselves, so the Snapchat-hack problem is unchanged. | `lib/useRecording.ts` |
| 2 | **Synced lyrics share no clock with the music.** The synced-lyrics clock starts when you tap record, not when the song starts in the other app, so the highlighted line is off by however long that gap is. | `components/RecordingScreen.tsx:90-92` |
| 3 | **Pasted lyrics scroll far too fast.** The pace formula scrolls a 300-word song in ~33s on Normal (~48s on Ballad) against a 3–4 min song. This hits the bring-your-own-lyrics path, which is the original wedge. The track length from iTunes was fetched but never saved. | `lib/useAutoScroll.ts:6-18` |
| 4 | **Takes can disappear.** Recordings were written to the OS cache folder and never moved, so the OS can delete them. On web the saved file link dies on reload. | expo-audio `AudioRecorder.swift:198`, `AudioRecorder.kt:237` |
| 5 | **One take per song.** Re-recording overwrites the previous take, so there's no history or sense of progress. | `lib/storage.ts` `saveRecording` |
| 6 | **The waveform is fake** (a fixed sine pattern). | `components/PostRecordingView.tsx:50` |
| 7 | **Sharing sends a bare .m4a file**, the dead end the Share Link PRD describes. | `components/PostRecordingView.tsx:167` |
| 8 | **The emotional product is missing.** The research says people pay to *feel* like a real singer; v0 plays back raw audio. | — |

None of the validation steps in `croon.md` (prototype with 3 people, Reddit posts, the iOS audio-session check) were recorded as done.

### The deciding constraint: where does the music come from?

Our ICP **streams** music, and we've decided the **music must be in the clip**. Those two pull against each other:

- Croon cannot get raw audio or a reliable playback clock from Spotify or Apple Music.
- Spotify's Developer Policy explicitly prohibits syncing sound recordings accessed through its platform with lyrics or visual media (see Sources). So no Spotify SDK integration.
- iOS does not let one app simply record what another app is playing. Whether the screen-broadcast route (ReplayKit) can capture streaming-app audio is **unverified**, and DRM-protected playback may be silent.

So v1 offers **two ways to get music into the clip**, and tests a third:

| Path | How the music gets in | Lyric timing | Quality |
|---|---|---|---|
| **A. Croon plays the track** | The user brings an audio file (Files app, AirDrop, a bought karaoke track, their own demo). Croon plays it to their headphones and mixes it with the clean voice at export. | **Exact**: Croon owns the clock. | Best: clean voice, clean track, Room polish on the voice only. |
| **B. Speaker mode** | Music plays from any app through the phone speaker; the mic records the room, voice and music together, like a phone video. | Voice follower, weaker because the music leaks into the mic; falls back to learned timing / taps. | "Phone video" quality, which is what the Snapchat-hack users already shared. Echo cancellation must be **off**, or iOS will strip the music. |
| **C. Capture another app's audio** (spike only) | Screen-broadcast capture (ReplayKit) of the streaming app's audio. | Voice follower. | Unknown. Likely blocked for DRM apps and adds friction (system broadcast picker). Only promote if spike S6 passes. |

**Headphones with music from another app** still works as a practice mode (voice-only take), but it no longer produces the shareable clip by itself.

**The biggest open product question:** for path A, *where do people get the track?* Most of our ICP doesn't own audio files, and the de facto source of karaoke tracks (especially for Hindi songs) is YouTube, which we can't legally pull from. See §7.

---

## 2. The Experience, Minute by Minute

The magic moment is not the recording. It is **hearing yourself back and not cringing**, then having something beautiful to send to the people who already love you.

1. **0:00 — "What are you singing?"**
   - There's one field: type a song name or paste lyrics, in English or Hindi (Devanagari or Roman script).
   - Search fills in plain lyrics where available. Add a track if you have one.
   - There's no library on first run, no speed settings and no sync step.
2. **0:15 — The room.**
   - The lyrics fill the screen. A soft glow reacts to your voice, which is the mic check without calling it one.
   - With a track: put your headphones in and Croon counts you in.
   - Without one: *"Put your music on the speaker, or sing it bare. Croon will follow you."*
3. **0:30 — You sing; the lyrics follow.**
   - The current line is large, and the **next line is always visible**, because singers read ahead.
   - With a Croon-played track, the lyrics run off the track's own clock, so they're exact.
   - Otherwise the lyrics follow your voice: they wait when you pause for a breath or a solo, and repeated choruses are handled.
   - If you get lost, **tap any line** and Croon picks up from there. That's the one gesture to re-anchor.
   - On wired headphones you hear yourself in a warm room (live monitoring).
   - Recording state is always honest: a small red dot while the mic is capturing.
4. **Stop — First playback is already flattering.**
   - The silence at the start and end is trimmed, and the voice is evened out and lightly cleaned up.
   - **Room** (a warm reverb) is on by default, with one toggle and no sliders. With path A it's applied to the voice only, sitting on top of the track.
   - The lyrics highlight in time as it plays.
5. **Keep — Every take is saved.**
   - "Take 4 · tonight." Star your favourite. Quiet progress over time ("first take vs. today"), never scores.
6. **Share — "Make a clip."**
   - A vertical (9:16) lyric video, **with the music**, where the words light up in time. Background is the artwork or a calm colour, with a small Croon mark.
   - Choose the whole take or **the chorus**, a ~30s clip Croon picked for you.
   - Or **send a link** to a web player.

---

## 3. The Core Capabilities

### 3.1 The lyric follower

Used whenever Croon doesn't own the music clock (speaker mode, bare voice, practice with another app).

- **Input:** on-device speech recognition streaming the singer's words.
  - **English:** Apple's **SpeechAnalyzer / SpeechTranscriber** (iOS 26, on-device, quick rough results that refine) or **WhisperKit**.
  - **Hindi:** SpeechTranscriber's published launch languages do **not** include Hindi. Check `SpeechTranscriber.supportedLocales` on a real device; plan on **WhisperKit** (Whisper is multilingual, including Hindi) unless the check passes.
- **Matcher:** tracks the singer's position in the **known** lyrics. Following known text is far easier than open transcription.
  - Fuzzy and phonetic match of the last few recognised words against the next couple of lines.
  - **Script normalisation for Hindi:** lyrics are often pasted in Roman script ("Hinglish") while the recogniser may output Devanagari. Transliterate both to one common phonetic form before matching.
  - Moves forward only, except for a search-ahead that handles repeated choruses.
  - A **pace estimate** keeps the highlight moving between matches.
  - A **tap on any line** re-anchors it immediately.
- **Accuracy target:** line-level live. Word-level comes after the take (3.3).
- **Fallback if it fails:** the first take is tap-to-advance; Croon saves those line timings and replays them on every later take ("Croon learns your song").

### 3.2 The native audio engine (AVAudioEngine)

- **Path A:** plays the track to the headphones and records the mic at the same time on one clock. At export, mixes voice + track, **compensating for output latency** (Bluetooth adds a lot: the singer hears the track late and sings late, so the voice must be shifted back).
- **Path B:** records the room with echo cancellation / voice processing **off**, so the music isn't removed.
- **Practice with another app:** an audio session that mixes with other apps, so their music keeps playing.
- **Live monitoring** with Room in the ears where latency allows (wired). Expect Bluetooth to be too slow; there, Room applies on playback only.
- **Polish chain on the voice:** cleanup (noise gate / light denoise) → compression → EQ → reverb ("Room").
- Polish is applied at playback and export **without altering the original files**, so the Room toggle costs nothing.
- Files live in the app's **documents folder**, never the cache.

### 3.3 The post-take aligner

- **Path A:** lyric timing per track is learned once (tap-through or alignment) and reused for every take.
- **Voice-led takes:** aligns the lyrics to the recorded voice after the take to get **word-by-word timing**.
- **Chorus detection** from repeated lyric lines powers the auto-picked 30s clip.

### 3.4 The clip renderer (AVFoundation)

- Builds the 9:16 lyric video **on the phone** (video composition with animated lyric layers), with the mixed audio, and hands it to the share sheet.
- The only backend in v1 is the **share link**: small storage plus a web page. The existing Next.js site in `web/` hosts it. The v0 design is in `docs/spec/spec-croon-share-link-mvp.md` on branch `legacy/mvp`; revisit it for the native app.

---

## 4. Stack

- **App:** Swift + SwiftUI, iOS only (target iOS 26 if we use SpeechAnalyzer).
- **Audio:** AVAudioEngine (record, play, monitor, polish), AVAudioSession.
- **Video:** AVFoundation composition for the lyric clip.
- **Speech:** Apple Speech framework (SpeechAnalyzer) and/or WhisperKit, decided by spikes S2 and S5.
- **Storage:** local-first. Audio in the documents folder; song and take metadata in SwiftData.
- **Lyrics:** user paste, plus LRCLIB search as a convenience (coverage of Hindi songs unknown; see risks).
- **Backend:** share links only, served by `web/`.
- **Carry over from v0:** bundle id `com.eightyeightmph.croon`; mic permission copy ("Croon needs microphone access to record your singing with scrolling lyrics."); app icon and logo in `assets/`; the palette and type (Lora + DM Sans) from `design-principles.md`.

### Data model sketch

```swift
@Model final class Song {
    var id: UUID
    var title: String
    var artist: String?
    var lyrics: String                 // plain text, any script; the source of truth
    var language: String               // "en" | "hi"
    var artworkURL: URL?
    var trackFileName: String?         // path A: imported track, relative to documents
    var learnedLineTimingsMs: [Int]?   // from a tap-through or alignment
    var createdAt: Date
    @Relationship(deleteRule: .cascade) var takes: [Take]
}

@Model final class Take {
    var id: UUID
    var voiceFileName: String          // relative to documents, never a cache path
    var durationMs: Int
    var mode: String                   // "track" | "speaker" | "voiceOnly"
    var outputLatencyMs: Int           // for aligning voice to track at mix time
    var lineTimingsMs: [Int]
    var roomOn: Bool
    var starred: Bool
    var recordedAt: Date
}
```

### Cut from v0

- Expo / React Native, and the web build of the app.
- Speed chips and the reading-pace scroll.
- Depending on synced lyric files (plain lyrics are enough).
- The Spotify / Apple Music / YouTube deep-link buttons, and any Spotify SDK integration.
- The hero card and filter chips. The library becomes a list of songs with their takes.
- The fake waveform and the record-button-centred flow.
- Using iTunes 30s previews as backing tracks.

---

## 5. Build Order

### Weeks 1–2: spikes (kill or confirm)

Checklists live in [tasks-rebuild-spikes.md](../tasks/tasks-rebuild-spikes.md).

| Spike | Pass if… | Fallback that's still good |
|---|---|---|
| **S1. Audio session.** Record while another app plays (wired, AirPods, speaker), and play + record in-app (path A). | Music keeps playing at normal quality, the mic is usable, and in-app play + record stays in sync. | Recommend wired or speaker for the other-app case. |
| **S2. English lyric follower.** 10 songs × 3 non-singers. | Right line lit ≥90% of the time, within ~1s, never runs ahead. | Tap-to-advance first take; learned timing after. |
| **S3. Live monitoring latency.** | Wired feels natural. Bluetooth expected to fail. | No live monitoring on Bluetooth. |
| **S4. Polish A/B.** 5 users, raw vs Room. | Most prefer Room and would send it. | Room off by default. |
| **S5. Hindi follower.** 10 Hindi songs, lyrics in Devanagari and Roman script. | Same bar as S2. | Tap-to-advance for Hindi in v1. |
| **S6. Music in the clip.** Path A mix with latency compensation on wired + AirPods; path B speaker-mode quality; path C capture test. | A sounds in sync on both; B is acceptable to send; C is a clear yes/no. | Ship A + B; drop C. |

### Weeks 3–6: the core loop

Type/paste → sing (path A and B) → polished playback → takes. TestFlight to 10–15 people who fit the ICP, English and Hindi singers.

**Measure:**
- Second-take rate in the first session.
- Share rate (did they send a clip to someone?).

### Weeks 7–9: share

The clip renderer and the share link.

### Later

- Separating vocals from a track, with a guide-vocal slider (needs a server GPU).
- A licensed karaoke-track source, if path A's "where do I get the track" problem blocks growth.
- More languages. Android.

---

## 6. Open Risks

- **Following sung lyrics is unproven**, and harder for Hindi: vibrato, held notes, ad-libs, accents, mixed scripts. That's why S2 and S5 come first.
- **Hindi recognition:** Apple's on-device recogniser may not support Hindi; WhisperKit does but is heavier on the device.
- **Hindi lyrics availability:** LRCLIB coverage of Hindi songs is unknown. Pasting may be the main path for Hindi.
- **Bluetooth:** our ICP mostly wears AirPods. Mic quality, music quality and latency all change once a record session is active (S1, S3, S6).
- **Lyrics licensing:** LRCLIB isn't licensed. Public share pages showing full lyrics count as public lyric display, which Genius and Musixmatch pay licences for.
- **Music licensing, now central:** clips contain someone else's recording. Path A tracks are the user's own files, but sharing a clip with a commercial track in it is a copyright question, more so with Croon branding on it. Get advice before promoting public posting.
- **Platform copying:** TikTok or Instagram could ship a karaoke mode. The defence is the private, flattering, follows-you experience, plus each user's library of learned songs and takes.

---

## 7. Questions Still Open

1. **Where do users get backing tracks for path A?** Their own files only, a partner catalog, or something else? This is the biggest product question now that music must be in the clip.
2. **Is speaker mode (path B) good enough** to send, or only a fallback?
3. **Hindi script:** do our first Hindi users paste lyrics in Devanagari, Roman script, or both?
4. **Minimum iOS version:** iOS 26 only (SpeechAnalyzer, simpler) or older devices too?

---

## Sources

- [Apple WWDC25: SpeechAnalyzer session](https://developer.apple.com/videos/play/wwdc2025/277/)
- [MacRumors: Apple transcription API speed tests](https://macrumors.com/2025/06/18/apple-transcription-api-faster-than-whisper)
- [SpeechAnalyzer launch languages (Add Pipe blog)](https://blog.addpipe.com/apple-speechanalyzer-api.md)
- [Apple docs: SpeechTranscriber](https://developer.apple.com/documentation/speech/speechtranscriber.md)
- [Spotify Developer Policy](https://developer.spotify.com/policy/)
- [Spotify: complying with the policy](https://developer.spotify.com/policy/complying/)
- [Apple Developer Forums: ReplayKit](https://developer.apple.com/forums/tags/replaykit)
