# Tasks: Croon Rebuild — Spikes (Weeks 1–2)

**Spec:** [spec-croon-rebuild.md](../spec/spec-croon-rebuild.md)
**Branch:** `rebuild`

---

## Purpose

Prove or kill the risky parts of the rebuild before building the app around them. Each spike has a pass bar and a fallback that still gives a good experience. Spikes are throwaway code: a bare test app or a scratch Swift module is fine.

## Notes

- Test on a **real iPhone**, not the simulator. Audio sessions, Bluetooth routing and latency behave differently in the simulator.
- Use people who fit the ICP for S2 and S4: non-singers who are a bit shy about their voice.
- Record results in the **Results** section of each spike, including what failed.

---

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, check it off by changing `- [ ]` to `- [x]`. Update after each sub-task, not just after the parent.

Do not start building the core loop (weeks 3–6) until every spike has a recorded result and a decision.

---

## Tasks

- [ ] S1 Recording while another app plays
  - [ ] S1.1 Bare test app: start an audio session that mixes with other apps, record the mic to the documents folder.
  - [ ] S1.2 Wired / USB-C headphones: play Spotify, start recording. Does Spotify keep playing? At normal volume and quality? Is the recording clean voice?
  - [ ] S1.3 AirPods, default routing: same checks. Note whether the music drops to call quality once the mic is active.
  - [ ] S1.4 AirPods, output to AirPods + input from the phone's built-in mic: same checks.
  - [ ] S1.5 Phone speaker: same checks. How much music is in the recording?
  - [ ] S1.6 Interruptions: a notification, a call, locking the screen mid-take. Is the file intact?
  - **Pass:** music keeps playing at normal quality and the mic is usable in at least wired and one AirPods configuration.
  - **Fallback:** recommend wired or speaker mode for v1.
  - **Results:**

- [ ] S2 Lyric follower
  - [ ] S2.1 Choose 10 English songs: mix of tempos, at least 2 with repeated choruses, 1 with fast verses.
  - [ ] S2.2 Prototype recognition with Apple SpeechAnalyzer (iOS 26); note latency of rough results.
  - [ ] S2.3 Prototype recognition with WhisperKit for comparison.
  - [ ] S2.4 Matcher: fuzzy/phonetic match of recent words against the next couple of lines; forward-only with search-ahead for repeats; pace estimate between matches; tap-to-re-anchor.
  - [ ] S2.5 3 non-singers × 10 songs, headphones mode. Log the lit line vs. the sung line over time.
  - [ ] S2.6 Repeat a few songs in speaker mode to measure the effect of music leaking into the mic.
  - **Pass:** the right line is lit ≥90% of the time, within ~1s, and it never runs ahead of the singer.
  - **Fallback:** first take is tap-to-advance; save line timings and replay them on later takes.
  - **Results:**

- [ ] S3 Live monitoring latency
  - [ ] S3.1 Route the mic through a reverb to the headphones in real time.
  - [ ] S3.2 Measure and feel the latency on wired headphones.
  - [ ] S3.3 Same on AirPods.
  - **Pass:** wired feels natural to a singer (no audible echo/doubling).
  - **Fallback:** no live monitoring on Bluetooth; Room on playback only.
  - **Results:**

- [ ] S4 Polish A/B
  - [ ] S4.1 Build the polish chain: trim silence, cleanup, compression, EQ, Room reverb, applied at playback without altering the original.
  - [ ] S4.2 5 users each record one take; play raw and Room versions in random order.
  - [ ] S4.3 Ask: which do you prefer? Would you send it to someone? Who?
  - **Pass:** most prefer Room and say they would send it.
  - **Fallback:** keep Room off by default.
  - **Results:**

- [ ] S5 Decision
  - [ ] S5.1 Write up results and update [spec-croon-rebuild.md](../spec/spec-croon-rebuild.md) (modes, follower approach, defaults).
  - [ ] S5.2 Answer the open decisions in the spec (iOS first, native code, languages, music in the clip).
  - [ ] S5.3 Write the core-loop PRD and tasks for weeks 3–6.
