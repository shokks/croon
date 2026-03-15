# PRD: SongBuddy Share Video Export (MVP)

**Status:** Draft  
**Created:** 2026-03-15  
**Spec:** [spec-songbuddy-share-video-mvp.md](../spec/spec-songbuddy-share-video-mvp.md)

---

## 1. Why Are We Building This?

After recording, users have a raw audio file. That's not something people feel proud to send. The moment a user finishes a take, they want to share a clip that looks as good as it sounds — something their friends and family will actually open and watch.

Right now, sharing is a dead end: there's no way to show the lyrics, the song name, or anything visually interesting. The share video feature turns the export into a polished 9:16 video — blurred album art background, scrolling lyrics, title + artist — that users will want to share to iMessage, WhatsApp, and Instagram Stories without embarrassment.

This is also the primary organic growth mechanic. Every video shared outside the app carries "Made with SongBuddy" branding, turning users into distribution.

---

## 2. Goals

- User can go from a completed recording to a shareable MP4 in 3 taps or fewer.
- Output video is polished enough that a user feels proud to send it to friends/family.
- Video renders server-side via Cloudflare — no large binary bundled in the app.
- Works on both iOS and Android.
- Failing to generate a video never blocks the user from sharing raw audio.

---

## 3. User Stories

**As an amateur singer**, I want to export a clean vertical video of my recording with scrolling lyrics, so I can share something that looks nice to my friends instead of just a blank audio file.

**As any user**, I want the app to just make it look good for me — I don't want to pick fonts or design anything — so I can share immediately without thinking.

**As a user reviewing a past recording**, I want to create a share video from my song library, not just right after recording, so I can share an older take whenever I feel like it.

**As any user**, I want to see a preview before sharing, so I know what I'm sending.

**As any user**, if the video export fails for any reason, I still want to be able to share my audio file, so I'm never stuck.

---

## 4. Functional Requirements

### Export Entry Points
1. The app must show a **"Create Share Video"** action on the post-recording screen (available immediately after a take is completed).
2. The app must show a **"Create Share Video"** action on the song detail screen for any song with a saved recording.

### Theme Selection
3. The app must offer 3 theme presets: `Clean`, `Warm`, and `Night`.
4. Themes must differ only by color palette (background gradient color, text color, progress bar color).
5. The last-used theme must be remembered and pre-selected next time.
6. Default theme for first-time use must be `Clean`.
7. Theme selection must be a single-tap selector (no modal, no extra navigation).

### Video Composition
8. The exported video must be **1080×1920 (9:16 vertical), 30fps, H.264 video + AAC audio, `.mp4`**.
9. The video must include a **background layer**:
   - If album art is available and loads successfully: scale/crop to 9:16, apply blur, apply dark overlay.
   - Else: render theme gradient as background.
10. The video must include a **title/artist overlay** at the top of the frame showing song name and artist (when available).
11. The video must include a **lyrics layer**:
    - Active lyric line: centered, large, high contrast.
    - Next lyric line: below active, smaller, reduced opacity.
12. The video must include a **thin progress bar** at the bottom of the frame, advancing with audio time.
13. The video must include a **small "Made with SongBuddy" watermark** in a safe corner.

### Lyric Timing
14. If `lyricsTimed` (timestamped lines) are present, the app must drive active/next line switching from those timestamps.
15. If `lyricsTimed` is absent, the app must auto-chunk `lyricsPlain` by newlines and distribute display durations proportionally across the audio duration.
16. If lyrics are entirely empty, the app must show a clear warning before export begins and must still allow export to proceed (lyrics-free video).

### Rendering (server-side)
17. When the user initiates export, the app must upload the audio file and a JSON metadata payload (lyrics, timings, album art URL, theme) to the Cloudflare Worker API.
18. The Worker must write the audio to R2, enqueue a render job, and return a `jobId` to the app immediately.
19. The app must poll the Worker's status endpoint (`GET /jobs/:jobId`) every 3 seconds until the job reaches `complete` or `failed`, or 5 minutes elapse (timeout).
20. On `complete`, the app must download the MP4 from the signed R2 URL returned by the Worker.
21. The app must display a progress/loading state throughout: `uploading → queued → rendering → downloading → ready`.
22. The user must be able to cancel at any point; the app sends a best-effort cancel request to the Worker and clears local state.
23. After download or cancel, the app must delete any locally cached temporary files.

### Preflight Validation
24. Before uploading, the app must verify:
    - Audio file exists at `recordingUri` and has duration > 0.
    - Lyric text length is within a safe limit (no unbounded strings).
    - If `albumArtUri` is provided, the path is accessible (skip gracefully if not).

### Failure Handling
25. If album art fails on the server, the processor must silently fall back to the theme gradient — the job must not fail because of a missing image.
26. If lyric parsing fails on the server, the processor must fall back to plain text rendering — the job must not fail because of malformed lyric data.
27. If the FFmpeg job fails or times out on the server, the Worker must mark the job `failed`. The app must:
    - Show an actionable error with a **Retry** option.
    - Keep the **Share Audio** option available so the user is not blocked.
28. If the upload itself fails (network error), the app must show a retry CTA without losing the user's recording or settings.

### Preview and Share
26. After successful export, the app must show a preview of the video (inline or fullscreen).
27. The app must provide a **Share** button that opens the native OS share sheet with the `.mp4` file.
28. The app must provide a **Save to Camera Roll** option.

---

## 5. Non-Goals (Out of Scope)

- Full video editor / timeline UI
- Per-word karaoke highlight effects
- Custom fonts, font size controls, or layout editor
- Animated backgrounds or motion graphics beyond fade transitions
- Multiple visual templates
- On-device FFmpeg (no ffmpeg-kit-react-native bundled in app)
- User accounts or authentication (job access is scoped by jobId only)
- Social feed / public posting from within SongBuddy
- Audio effects (reverb, pitch correction, EQ)

---

## 6. Design Considerations

- **Entry point (post-recording):** Add "Create Share Video" button alongside existing Share Audio action on the post-recording screen. Keep the audio share option always visible — video export is additive, not a replacement.
- **Entry point (song detail):** Show a "Create Share Video" option in the song's action row (only visible when a recording exists).
- **Theme picker:** Small horizontal chip row — three tappable labels (`Clean / Warm / Night`). Selected chip is highlighted. No modal needed.
- **Export progress:** Full-screen or bottom sheet overlay with a spinner or progress bar and a Cancel button. Avoid blocking the rest of the app.
- **Preview:** Show the exported video inline (not auto-play with sound) with Play and Share buttons below.
- **Error state:** Clear message ("Video export failed") + two CTAs: "Try Again" and "Share Audio Instead".

---

## 7. Technical Considerations

### Architecture
```
Expo app
  → upload audio + metadata  →  Cloudflare Worker API
  → enqueue job              →  Cloudflare Queue
  → process                  →  FFmpeg processor service (e.g. Fly.io container)
  → write output MP4         →  Cloudflare R2
  → poll for status          →  app downloads signed R2 URL → Share
```

### Cloudflare Worker (API layer)
- Thin API only — no transcoding in the Worker itself (CPU time limit).
- Endpoints needed:
  - `POST /jobs` — accept multipart upload (audio file + JSON metadata), write to R2, enqueue job, return `{ jobId }`.
  - `GET /jobs/:jobId` — return `{ status, outputUrl? }` where status is `queued | rendering | complete | failed`.
  - `DELETE /jobs/:jobId` — best-effort cancel.
- Use Cloudflare R2 for both input and output storage.
- Use Cloudflare Queue to pass job payloads to the processor.
- Set R2 object TTL (1 hour) via lifecycle rules — no manual cleanup needed.

### FFmpeg Processor Service
- A separate long-running service (container on Fly.io, Railway, or a lightweight VPS) that consumes the Cloudflare Queue.
- Runs deterministic FFmpeg filter graph for the single template.
- Reads audio from R2 signed URL, writes output MP4 back to R2, updates job status via Worker or a shared KV/D1 store.
- Handles fallback logic: missing album art → gradient; malformed lyrics → plain text.

### App-side Export Client
- Build `lib/shareVideoExport.ts` to manage the full lifecycle: preflight → upload → poll → download → cleanup.
- Export state machine: `idle → uploading → queued → rendering → downloading → ready(localUri) | error(message)`.
- Use `expo-file-system` for audio upload (multipart) and MP4 download.
- Poll with `setInterval`; clear on terminal state or unmount.

### Album Art
Reuse `albumArtUri` already stored on Song from the iTunes integration — pass as URL in the metadata payload (processor fetches it directly, no re-upload needed).

### Lyric Timing
Reuse `SyncedLyricLine[]` from `lyricsSync.ts` — serialize as JSON in the metadata payload.

### Lessons Applied
- **MVP Over-Engineering:** Fixed single template. No editor UI. No effects.
- **Never block the user:** Audio share remains available regardless of server-side export outcome.

---

## 8. Success Metrics (Real User Feedback)

- 3 beta users export and share a video without asking for help or hitting an unrecoverable error.
- At least 2 users say the output "looks good enough to send" (not embarrassing).
- At least 1 user shares a video to WhatsApp, iMessage, or Instagram Stories from the app.
- At least 1 user accesses "Create Share Video" from the song detail screen (not just post-recording).
- Zero reports of the video export failing and leaving the user with no sharing option.

---

## 9. Open Questions

- **FFmpeg processor host:** Where does the FFmpeg processor run? Fly.io container, Railway, or a simple VPS are all viable. Decision needed before implementation starts.
- **Job status storage:** How does the processor update job status? Options: Cloudflare KV (simple, fast reads), Cloudflare D1 (SQL), or a status field written back to R2. Recommend KV for MVP simplicity.
- **Upload size limits:** Cloudflare Worker request size limit is 100MB by default. Confirm typical audio file sizes from the recorder and whether direct-to-R2 presigned upload is needed for large files.
- **Album art resolution:** High-res album art could slow blur processing on the processor. Confirm max dimension cap before passing to FFmpeg (e.g. downsample to 1080px).
- **Polling vs webhook:** Polling every 3s is simple for MVP. A webhook/push notification path is cleaner for UX but adds complexity — defer to v2.
- **Waveform as an alternative to progress bar:** Deferred to v2 but worth noting for a more premium look.
