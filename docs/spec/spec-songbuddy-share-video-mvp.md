# Spec: SongBuddy Share Video Export (MVP)

## Goal
Generate a polished share video in the simplest flow possible: **Record → Export → Share**.

## Product Principles
- **Zero-edit by default:** no timeline, no advanced controls.
- **Consistent quality over customization:** one layout, limited theme choices.
- **Never block sharing:** if video export fails, user can still share audio.

## Hard MVP Decisions (locked)
- Renderer: **Server-side FFmpeg** (not bundled in app).
- Infrastructure: **Cloudflare** (R2 storage, Worker API, Queue, separate FFmpeg processor).
- Output: **MP4, 1080x1920, 30fps, H.264 + AAC**.
- Layout: **single template** (no template picker).
- Motion: **fade only** (no complex animations).
- Progress UI: **simple bottom progress bar only**.
- Themes: `clean | warm | night` (color changes only).
- No user account required (jobs identified by a short-lived job ID).

## User Flow (minimal)
1. User completes recording.
2. User taps **Create Share Video**.
3. App exports using last-used theme (default: `clean`).
4. User sees preview and taps **Share**.

Optional: user can change theme before export (single tap selector).

## Inputs
- `recordingUri` (required)
- `lyricsPlain` (required)
- `lyricsTimed?` (`{ startMs, endMs, text }[]`, optional)
- `albumArtUri?` (optional)
- `shareTheme` (`clean | warm | night`, default `clean`)

## Visual Composition
1. **Background**
   - If `albumArtUri` exists and loads: crop to 9:16, blur, darken overlay.
   - Else: theme gradient fallback.
2. **Lyrics**
   - Active line: centered, large, high contrast.
   - Next line: below, smaller, reduced opacity.
3. **Progress**
   - Thin bottom progress bar tied to audio time.
4. **Branding**
   - Small “Made with SongBuddy” watermark in safe corner.

## Lyric Timing Behavior
- If `lyricsTimed` exists: drive active/next line from timestamps.
- If missing: auto-chunk `lyricsPlain` by lines and assign durations proportionally.
- If both are unavailable/empty: render without lyrics and show explicit warning before export.

## Architecture
```
Expo app
  → upload audio + metadata → Cloudflare Worker API
  → enqueue job            → Cloudflare Queue
  → process                → FFmpeg processor service
  → write output MP4       → Cloudflare R2
  → poll/webhook           → app downloads signed R2 URL → Share
```

- **Cloudflare Worker:** thin API layer — receives upload, writes to R2, enqueues job, returns `jobId`. Also exposes a status endpoint polled by the app.
- **Cloudflare R2:** stores raw audio input and rendered MP4 output. Pre-signed URLs for upload and download.
- **Cloudflare Queue:** decouples API from processor; handles retries.
- **FFmpeg processor:** separate long-running service (e.g. Fly.io container or lightweight VPS) that consumes the queue, runs FFmpeg, writes output MP4 to R2, updates job status.

> Workers are not used for FFmpeg transcoding directly — they lack the CPU time budget for it.

## Robustness Requirements
### Client-side preflight
- Confirm audio file exists locally and has duration > 0.
- Validate/sanitize lyric text and metadata before upload.

### Job lifecycle
- App receives a `jobId` immediately after upload.
- App polls Worker status endpoint (`GET /jobs/:jobId`) until `complete | failed`.
- Poll interval: every 3s, max 5 minutes before timeout.
- Allow user to cancel job (best-effort cancel call to Worker; app clears local state).
- On success, app downloads MP4 from signed R2 URL.

### Server-side failure handling
- Album art fetch/decode fails → processor uses gradient fallback, job continues.
- Lyric parse fails → processor uses plain text fallback, job continues.
- FFmpeg crash/timeout → Worker marks job `failed`; app surfaces retry CTA + audio share option.
- R2 upload failure → Worker returns error immediately; app surfaces retry.

### Cleanup
- R2 objects (input + output) deleted after a TTL (e.g. 1 hour) via R2 lifecycle rules.
- App clears local job state after download or cancel.

## Performance Targets
- End-to-end (upload → render → download) target: under 60s for a typical 30–60s song.
- Fixed template only — no dynamic high-cost filter graphs.
- Queue handles burst; processor scales independently of the app.

## Out of Scope
- Full editor/timeline
- Per-word karaoke effects
- Advanced transitions/effects packs
- User font/layout customization
- On-device FFmpeg (no ffmpeg-kit-react-native)
- User accounts or auth (job-scoped access only)

## Acceptance Criteria
- User can export and share in <= 3 taps after recording.
- Output is readable and polished with/without album art.
- Export succeeds for timed and non-timed lyrics paths.
- On failure, user still has a working audio share path.
- No regression to existing record/save flow.

## Implementation Plan
1. Define locked template tokens and 3 theme palettes.
2. Build Cloudflare Worker API: upload endpoint, job status endpoint.
3. Set up R2 buckets (input, output) with TTL lifecycle rules.
4. Set up Cloudflare Queue between Worker and processor.
5. Build FFmpeg processor service: consumes queue, runs filter graph, writes to R2, updates job status.
6. Implement deterministic FFmpeg filter graph for the single template.
7. Build app-side export flow: preflight → upload → poll → download → preview → share.
8. Add export state machine (`idle → uploading → queued → rendering → ready | error`).
9. Validate iOS/Android happy path + all fallback paths.

## Validation Checklist
- Upload + render + download succeeds end-to-end.
- Timed lyrics + album art export works.
- Timed lyrics + no album art fallback works.
- No timed lyrics auto-chunking works.
- Corrupt album art does not fail the job.
- FFmpeg failure marks job as `failed`; app surfaces retry + audio share.
- R2 objects are cleaned up after TTL.
- MP4 opens in iMessage/WhatsApp/IG Story/TikTok.
