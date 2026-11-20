# Tasks: Croon Rebuild — Spikes (Weeks 1–2)

**Spec:** [spec-croon-rebuild.md](../spec/spec-croon-rebuild.md)
**Branch:** `main`

---

## Purpose

Prove or kill the risky parts of the rebuild before building the app around them. Each spike has a pass bar and a fallback that still gives a good experience. Spikes are throwaway code: a bare SwiftUI test app per spike, or one scratch app with a screen per spike, is fine.

## Notes

- Test on a **real iPhone running iOS 26**, not the simulator. Audio sessions, Bluetooth routing, latency and speech models behave differently in the simulator.
- Use people who fit the ICP for S2, S4 and S5: non-singers who are a bit shy about their voice. Include Hindi singers for S5.
- Record results in the **Results** section of each spike, including what failed.

---

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, check it off by changing `- [ ]` to `- [x]`. Update after each sub-task, not just after the parent.

Do not start building the core loop (weeks 3–6) until every spike has a recorded result and a decision.

---

## Tasks

- [ ] S1 Audio session
  - [ ] S1.1 Bare test app: an audio session that mixes with other apps; record the mic to the documents folder.
  - [ ] S1.2 Wired / USB-C headphones: play Spotify, start recording. Does Spotify keep playing at normal volume and quality? Is the recording clean voice?
  - [ ] S1.3 AirPods, default routing: same checks. Note whether the music drops to call quality once the mic is active.
  - [ ] S1.4 AirPods, output to AirPods + input from the phone's built-in mic: same checks.
  - [ ] S1.5 Phone speaker: same checks. How much music is in the recording?
  - [ ] S1.6 Path A: play a local audio file in-app while recording the mic on the same engine. Do they stay in sync over a full song?
  - [ ] S1.7 Interruptions: a notification, a call, locking the screen mid-take. Is the file intact?
  - **Pass:** music keeps playing at normal quality and the mic is usable in at least wired and one AirPods configuration; in-app play + record stays in sync.
  - **Fallback:** recommend wired or speaker for the other-app case.
  - **Results:**

- [ ] S2 English lyric follower
  - [ ] S2.1 Choose 10 English songs: mix of tempos, at least 2 with repeated choruses, 1 with fast verses.
  - [ ] S2.2 Prototype recognition with SpeechAnalyzer / SpeechTranscriber; note the latency of rough results.
  - [ ] S2.3 Prototype recognition with WhisperKit for comparison (latency, accuracy, battery, heat).
  - [ ] S2.4 Matcher: fuzzy/phonetic match of recent words against the next couple of lines; forward-only with search-ahead for repeats; pace estimate between matches; tap-to-re-anchor.
  - [ ] S2.5 3 non-singers × 10 songs, headphones. Log the lit line vs. the sung line over time.
  - [ ] S2.6 Repeat a few songs in speaker mode to measure the effect of music leaking into the mic.
  - **Pass:** the right line is lit ≥90% of the time, within ~1s, and it never runs ahead of the singer.
  - **Fallback:** first take is tap-to-advance; save line timings and replay them on later takes.
  - **Results:**

- [ ] S3 Live monitoring latency
  - [ ] S3.1 Route the mic through a reverb to the headphones in real time.
  - [ ] S3.2 Measure and feel the latency on wired headphones.
  - [ ] S3.3 Same on AirPods.
  - **Pass:** wired feels natural to a singer (no audible echo or doubling).
  - **Fallback:** no live monitoring on Bluetooth; Room on playback only.
  - **Results:**

- [ ] S4 Polish A/B
  - [ ] S4.1 Build the voice polish chain: trim silence, cleanup, compression, EQ, Room reverb, applied at playback without altering the original.
  - [ ] S4.2 5 users each record one take; play raw and Room versions in random order (with a track for some, voice-only for others).
  - [ ] S4.3 Ask: which do you prefer? Would you send it to someone? Who?
  - **Pass:** most prefer Room and say they would send it.
  - **Fallback:** keep Room off by default.
  - **Results:**

- [ ] S5 Hindi lyric follower
  - [ ] S5.1 On device, check whether `SpeechTranscriber.supportedLocales` includes Hindi, and whether its model actually downloads and works.
  - [ ] S5.2 Choose 10 Hindi songs; prepare lyrics in both Devanagari and Roman script.
  - [ ] S5.3 Prototype recognition with WhisperKit (and SpeechTranscriber if S5.1 passes). Note which script the output comes back in.
  - [ ] S5.4 Script normalisation: transliterate lyrics and recognised words to one common phonetic form before matching.
  - [ ] S5.5 Hindi singers × 10 songs, headphones. Log the lit line vs. the sung line.
  - [ ] S5.6 Check LRCLIB coverage for the 10 songs.
  - **Pass:** same bar as S2.
  - **Fallback:** tap-to-advance for Hindi in v1, with learned timing after the first take.
  - **Results:**

- [ ] S6 Music in the clip
  - [ ] S6.1 Path A: mix voice + track at export with output-latency compensation. Listen for sync on wired and on AirPods.
  - [ ] S6.2 Path B: speaker mode with echo cancellation / voice processing off. Is the music audible and the mix acceptable to send?
  - [ ] S6.3 Path C: test a screen-broadcast (ReplayKit) capture of Spotify and Apple Music audio. Is anything captured? How much friction for the user?
  - [ ] S6.4 Render a 30s 9:16 lyric video with the mixed audio on device; check render time.
  - **Pass:** A sounds in sync on both; B is acceptable to send; C is a clear yes or no.
  - **Fallback:** ship A + B; drop C.
  - **Results:**

- [ ] S7 Decision
  - [ ] S7.1 Write up the results and update [spec-croon-rebuild.md](../spec/spec-croon-rebuild.md): recording modes, recognition engine per language, defaults.
  - [ ] S7.2 Answer the open questions in spec §7 (track source, speaker mode, Hindi script, minimum iOS).
  - [ ] S7.3 Write the core-loop PRD and tasks for weeks 3–6.
