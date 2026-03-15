# PRD: SongBuddy Share Link (MVP)

**Status:** Draft  
**Created:** 2026-03-15  
**Spec:** [spec-songbuddy-share-link-mvp.md](../spec/spec-songbuddy-share-link-mvp.md)

---

## 1. Why Are We Building This?

After recording, users have a raw audio file. That is not something people feel proud to send. The moment a user finishes a take, they want to share something that looks as good as it sounds — something their friends and family will actually open.

Right now sharing is a dead end: a bare audio file with no song name, no lyrics, no visual identity. This feature turns every recording into a polished public web page — album art background, scrolling lyrics, song title, audio player — that recipients open in any browser with one tap. No download. No sign-in.

This is also the primary organic growth mechanic. Every shared link carries "Made with SongBuddy" branding and a path back to the app store.

---

## 2. Goals

- User can go from a completed recording to a shareable link in 3 taps or fewer.
- Link preview in iMessage/WhatsApp shows album art and song title before the recipient even taps.
- Recipient can play the recording and read lyrics without signing in or downloading anything.
- If link creation fails, the user is never blocked from sharing raw audio.
- Works on both iOS and Android.

---

## 3. User Stories

**As an amateur singer**, I want to share a link to my recording that looks nice, so my friends and family get something worth opening instead of a plain audio file.

**As any user**, I want the app to handle the presentation automatically — I should not have to design anything — so I can share immediately after recording.

**As a user reviewing a past recording**, I want to create a share link from my song library, not just right after recording, so I can share an older take whenever I want.

**As a recipient**, I want to tap a link and instantly hear the recording with lyrics visible, so I do not need to download anything or sign in.

**As any user**, if link creation fails for any reason, I still want to be able to share my audio file so I am never stuck.

---

## 4. Functional Requirements

### Share Entry Points
1. The app must show a **Share** action on the post-recording screen (primary entry point, available immediately after a take).
2. The app must show a **Share Recording** action on the song detail screen for any song with a saved recording.

### Theme Selection
3. The app must offer 3 theme presets: `Clean`, `Warm`, and `Night`.
4. Themes affect the share page color palette only — background gradient, text color, progress bar color.
5. The last-used theme must be remembered and pre-selected next time.
6. Default theme for first use must be `Clean`.
7. Theme selection must be a single-tap chip selector — no modal, no extra navigation.

### Share Link Creation
8. When the user taps Share, the app must:
   - Upload the audio recording to Convex File Storage.
   - Call the `createShare` Convex mutation with the returned `storageId` plus metadata: title, artist, album art URL, plain lyrics, timed lyrics, theme, and duration.
   - Receive a `shareId` in response.
   - Construct the public share URL: `songbuddy.app/s/{shareId}`.
9. The app must display upload state throughout: `uploading → creating → ready(shareUrl) | error`.
10. On `ready`, the app must open the native OS share sheet pre-filled with the share URL.
11. The user must be able to cancel the upload at any point; the app clears local upload state on cancel.

### Convex Backend
12. The `createShare` mutation must:
   - Accept an audio file blob and metadata payload.
   - Store the audio in Convex File Storage (returns `storageId`).
   - Insert a share document in the `shares` table with all metadata fields plus `expiresAt` set to 7 days from creation.
   - Return the generated `shareId`.
13. The `getShare` query must be public (no auth required) and must:
   - Accept a `shareId`.
   - Return the full share document including the CDN audio URL resolved from `storageId`.
   - Return `null` if the share does not exist or `expiresAt` has passed.

### Share Page (Next.js `/s/[shareId]`)
14. The share page must be server-rendered and include the following Open Graph meta tags:
    - `og:title` — `"{title} by {artist}"` or `"{title}"` if no artist.
    - `og:description` — `"Listen on SongBuddy"`.
    - `og:image` — album art URL if available; else a static themed gradient fallback image.
15. The share page must render a full-viewport, mobile-first web player with:
    - **Background** — blurred album art if available; else theme gradient.
    - **Header** — song title and artist, centered, top safe area.
    - **Lyrics area** — active line (large, high contrast, centered) and next line (smaller, reduced opacity), synchronized to audio playback.
    - **Player controls** — play/pause button, progress bar, and timestamp.
    - **Footer** — "Made with SongBuddy" linking to the landing page or app store.
16. Lyrics must advance in sync with audio playback via the `timeupdate` event:
    - If `lyricsTimed` is present: advance active line when `startMs ≤ currentTime × 1000 < endMs`.
    - If `lyricsTimed` is absent: distribute lines evenly across `durationMs`.
17. If the share is expired or not found, the page must render a clean message with a CTA to download SongBuddy — no error crash.

### Preflight Validation
18. Before uploading, the app must verify:
    - Audio file exists at `recordingUri` and `durationMs > 0`.
    - Lyric text is within a safe character length limit.
    - `albumArtUri`, if provided, is accessible — skip gracefully if not.

### Failure Handling
19. If the Convex upload or `createShare` mutation fails (network error or server error), the app must show a retry CTA without losing the user's recording or settings.
20. If album art is unreachable on the share page, the page must silently use the theme gradient — no broken image shown to the recipient.
21. If lyric data is malformed on the share page, the page must fall back to plain text display without crashing.
22. At all times, the raw audio share option must remain available in the app as a fallback so the user is never blocked.

### Expiry
23. The `expiresAt` field must be set to 7 days from creation on every share document.
24. The `getShare` query must enforce expiry — expired shares must be treated as not found.

---

## 5. Non-Goals (Out of Scope)

- Video file export (deferred to v2 if TikTok/IG posting becomes a goal)
- User accounts or share history
- Editing or deleting a share after creation
- Share analytics or play counts
- Permanent shares (no expiry option for MVP)
- Audio effects — reverb, pitch correction, EQ
- Social feed or public listing of shares
- Cleanup of expired Convex documents and storage files (defer scheduled action to v2)

---

## 6. Design Considerations

- **Post-recording entry point:** "Share" is the primary action alongside the existing "Share Audio" option. Keep both visible — link share is additive, not a replacement.
- **Song detail entry point:** "Share Recording" appears in the song action row only when a saved recording exists for that song.
- **Theme picker:** Horizontal chip row (`Clean / Warm / Night`) on the share/export screen. Selected chip is highlighted. No modal.
- **Upload state:** Bottom sheet or inline overlay with a spinner, progress indicator, and cancel button. Should not block navigation elsewhere in the app.
- **Share ready:** Immediately opens native share sheet with the URL pre-filled. No separate preview screen required for MVP.
- **Error state:** Clear message ("Couldn't create share link") with two CTAs: "Try Again" and "Share Audio Instead".
- **Share page:** Designed for mobile browsers first (iOS Safari, Android Chrome). Full-viewport on load, no scroll needed to see player.
- **Expired share page:** Simple, friendly message — "This share has expired" — with a link to SongBuddy. No navigation chrome.

---

## 7. Technical Considerations

### Repo Structure
```
songbuddy/                  ← repo root
  app/                      ← Expo Router screens (existing)
  convex/                   ← shared Convex backend (new)
  web/                      ← Next.js site (new)
    app/
      s/[shareId]/page.tsx
    package.json
    next.config.js
  package.json              ← Expo root
  metro.config.js
```

- `convex/` at root is shared — both Expo and Next.js import from `convex/_generated/api`.
- `web/` has its own isolated `package.json` and `node_modules` — no interference with Expo or Metro.

### Deployment
| What | How | URL |
|---|---|---|
| Expo app | EAS Build → App Store / Play Store | Native binary, no URL |
| Next.js site | Vercel — Root Directory: `web` | `songbuddy.app` |
| Convex backend | `npx convex deploy` from repo root | Convex Cloud (auto-managed) |

- Vercel serves `web/` at the root domain — `/s/[shareId]` resolves as `songbuddy.app/s/abc123`.
- Expo app references the share base URL via env var: `EXPO_PUBLIC_SHARE_BASE_URL=https://songbuddy.app`.
- Both Expo and Next.js connect to Convex using `CONVEX_URL` in their respective `.env` files.

### Architecture
```
Expo app (root)
  → upload audio blob       →  Convex File Storage (storageId)
  → createShare mutation    →  Convex database (shares table)
  → returns shareId
  → constructs $EXPO_PUBLIC_SHARE_BASE_URL/s/{shareId}

Share URL: songbuddy.app/s/{shareId}

Next.js (web/) /s/[shareId]
  → getShare query (server) →  Convex database
  → SSR + OG tags
  → client: audio player + synced lyrics
```

### Convex Schema
```ts
// convex/schema.ts
shares: defineTable({
  shareId: v.string(),
  storageId: v.id("_storage"),
  title: v.string(),
  artist: v.optional(v.string()),
  albumArtUrl: v.optional(v.string()),
  lyricsPlain: v.string(),
  lyricsTimed: v.optional(v.array(v.object({
    startMs: v.number(),
    endMs: v.number(),
    text: v.string(),
  }))),
  theme: v.union(v.literal("clean"), v.literal("warm"), v.literal("night")),
  durationMs: v.number(),
  expiresAt: v.number(),
}).index("by_shareId", ["shareId"])
```

### App-side Share Client
- Build `lib/shareLink.ts`: preflight check → Convex file upload → `createShare` mutation → return URL.
- Export state type: `idle | uploading | creating | ready | error`.
- Use `expo-file-system` to read the audio file for Convex upload.

### Next.js Share Page
- Route: `/s/[shareId]` as a server component — fetches share data, injects OG tags, passes to client player.
- OG image: use album art URL directly if available; otherwise use a static per-theme fallback image (simplest for MVP — `@vercel/og` dynamic generation is v2).
- Client player: `<audio>` element with `timeupdate` listener driving lyric line state in React.

### Existing Data Reuse
- `albumArtUrl` is already stored on `Song` from the iTunes search integration — pass directly, no re-upload.
- `SyncedLyricLine[]` from `lyricsSync.ts` maps directly to `lyricsTimed` — serialize as JSON array.

### Lessons Applied
- **MVP simplicity:** No render pipeline, no queue, no background jobs — upload + insert + serve a web page.
- **Never block the user:** Raw audio share remains available regardless of link creation outcome.

---

## 8. Success Metrics (Real User Feedback)

- 3 beta users create and send a share link without hitting an error or asking for help.
- At least 2 recipients open the link and successfully play the recording in a browser.
- At least 1 user confirms the iMessage or WhatsApp preview card shows the correct song title and album art.
- At least 1 user accesses Share from the song detail screen (not just post-recording).
- Zero reports of link creation failing and leaving the user with no sharing option at all.

---

## 9. Open Questions

- **Convex file size limits:** Confirm Convex File Storage limits for audio files. Typical recordings are 5–20MB for a 30–60s take — expected to be fine but worth verifying before implementation.
- **Share URL domain:** Deployment structure is confirmed — Next.js `web/` subfolder deployed to Vercel with Root Directory set to `web`, serving `songbuddy.app`. Expo app uses `EXPO_PUBLIC_SHARE_BASE_URL=https://songbuddy.app`.
- **OG image fallback:** Static per-theme image (fastest to ship) vs dynamic `@vercel/og` generation (more polished). Static is sufficient for MVP.
- **Expiry copy in app:** Should the share sheet or share screen mention the 7-day expiry to set expectations? Simple one-line note is enough — no push notification needed.
