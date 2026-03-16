# Spec: Croon Share Link (MVP)

## Goal
Let users share a recording as a **polished public link** — no video rendering, no FFmpeg, no file downloads for the recipient.

**Record → tap Share → get a link → send it.**

Recipient taps the link and gets a beautiful mini web player with the song title, album art, audio playback, and scrolling lyrics. Works instantly in any browser.

## Product Principles
- **Link over file:** a URL is more frictionless than a video file for close sharing.
- **Zero-edit by default:** no controls beyond picking a theme.
- **Never block sharing:** if link generation fails, raw audio share remains available.
- **Organic growth:** every shared link carries "Made with Croon" branding and a link back to the app.

## Hard MVP Decisions (locked)
- No FFmpeg, no video rendering.
- Share output: **a public URL** (`croon.app/s/{shareId}`).
- Storage: **Convex File Storage** for audio, **Convex database** for metadata.
- Share page: **Next.js** hosted alongside the landing page.
- Themes: `clean | warm | night` (affects share page color palette only).
- No user account required — shares are identified by `shareId` only.
- Shares expire after **7 days** (TTL enforced server-side).

## Repo Structure
```
croon/                  ← repo root
  app/                      ← Expo Router screens (existing)
  components/               ← Expo components (existing)
  convex/                   ← shared Convex backend (new)
  web/                      ← Next.js site (new)
    app/
      s/[shareId]/page.tsx  ← share page
    package.json
    next.config.js
  package.json              ← Expo root
  metro.config.js
```

- `convex/` lives at the repo root and is shared — both the Expo app and Next.js import from `convex/_generated/api`.
- `web/` has its own `package.json` and `node_modules` — completely isolated from Expo's dependency tree.
- Metro ignores `web/` automatically (outside Expo Router's `app/` scope).

## Deployment
| What | How | URL |
|---|---|---|
| Expo app | EAS Build → App Store / Play Store | Native binary, no URL |
| Next.js site | Vercel — Root Directory set to `web/` | `croon.app` |
| Convex backend | `npx convex deploy` from repo root | Auto-managed by Convex Cloud |

- Vercel serves `web/` at the root domain — `/s/[shareId]` resolves as `croon.app/s/abc123`.
- The Expo app references the share base URL via `EXPO_PUBLIC_SHARE_BASE_URL=https://croon.app`.
- Both the Expo app and Next.js site connect to Convex using their own `.env` with `CONVEX_URL`.

## Architecture
```
Expo app (root)
  → Convex mutation: createShare(audioFile, metadata)
    → upload audio blob → Convex File Storage (storageId)
    → insert share doc  → Convex database
    → return shareId
  → constructs: $EXPO_PUBLIC_SHARE_BASE_URL/s/{shareId}

Share URL: croon.app/s/{shareId}

Next.js (web/) page /s/[shareId]
  → fetch public Convex query: getShare(shareId)
  → SSR + OG tags → render mini web player
```

### Components
- **Convex File Storage:** stores the raw audio recording. Returns a CDN-served URL for streaming.
- **Convex database:** stores share document (metadata + storageId + expiry).
- **Convex mutation `createShare`:** validates inputs, writes file + doc, returns `shareId`.
- **Convex query `getShare`:** public, returns share data for a given `shareId` (respects expiry).
- **Next.js `web/app/s/[shareId]/page.tsx`:** server-rendered share page with OG tags + client-side audio player.

## Convex Data Model

```ts
// convex/schema.ts
shares: defineTable({
  shareId: v.string(),         // short random ID (e.g. 8 chars)
  storageId: v.id("_storage"), // Convex File Storage reference
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
  expiresAt: v.number(),        // Unix ms, 7 days from creation
}).index("by_shareId", ["shareId"])
```

## App-Side Flow

1. User completes recording.
2. User taps **Share**.
3. (Optional) User picks theme (`clean | warm | night`) — single-tap chip selector. Default: last used or `clean`.
4. App calls `createShare` mutation:
   - Uploads audio file to Convex File Storage.
   - Passes metadata (title, artist, albumArtUrl, lyrics, timings, theme, duration).
5. Mutation returns `shareId`.
6. App shows the share URL with a native share sheet pre-filled.
7. User sends via iMessage, WhatsApp, or copies link.

### App Export States
`idle → uploading → creating → ready(shareUrl) | error`

### Entry Points
- Post-recording screen: primary share action.
- Song detail screen: "Share Recording" for any song with a saved recording.

## Share Page (Next.js `/s/[shareId]`)

### Server-side (SSR)
- Fetch share doc from Convex on the server.
- If not found or expired: render a clean 404/expired page with a CTA to download Croon.
- Inject full OG/meta tags for rich link previews:
  - `og:title` — `"{title} by {artist}" or "{title}"`
  - `og:description` — `"Listen on Croon"`
  - `og:image` — album art URL if available, else themed gradient OG image
  - `og:audio` — Convex CDN audio URL (where supported)
  - `twitter:card` — `player` card where supported

### Client-side (mini web player)
Visual layout (mobile-first, full-viewport):

1. **Background** — blurred album art if available; else theme gradient.
2. **Header** — song title + artist, centered, top safe area.
3. **Lyrics area** — scrolling lyrics synchronized to playback position:
   - Active line: large, high contrast, centered.
   - Next line: smaller, reduced opacity.
   - If no `lyricsTimed`: auto-chunk `lyricsPlain` proportionally by duration.
4. **Player controls** — centered: play/pause button + progress bar + timestamp.
5. **Footer** — "Made with Croon" → links to landing page / app store.

### Lyric Sync on Web
- Drive active line from `audio.currentTime` via `timeupdate` event listener.
- If `lyricsTimed` present: find active line by `startMs ≤ currentTime * 1000 < endMs`.
- If missing: distribute lines evenly across `durationMs`.

## Robustness Requirements

### App-side
- Preflight: confirm `recordingUri` exists and `durationMs > 0` before upload.
- If upload fails (network): show retry CTA, preserve recording and settings.
- If `createShare` mutation fails: show error + keep raw audio share available.
- Upload progress indicator — audio files can be 5–20MB.

### Share page
- Expired or missing share: clean error page, no crash.
- Album art URL unreachable: theme gradient fallback, no broken image.
- Lyric parse error: fall back to plain text display.
- Audio stream fails: show error in player, page does not crash.

### Expiry
- `expiresAt` is checked in `getShare` query — returns null if expired.
- No background cleanup job needed for MVP; expired docs remain in DB but are inert.
- Optionally: scheduled Convex action to purge old docs + storage files (defer to v2).

## Out of Scope
- Video file export (deferred — add FFmpeg pipeline later if TikTok/IG posting becomes a goal)
- User accounts or share history
- Share analytics / play counts
- Editing or deleting a share after creation
- Permanent shares (no expiry)
- On-device FFmpeg

## Performance Targets
- Upload + share URL ready: under 10s for a typical recording on a decent connection.
- Share page load (SSR): under 2s.
- Audio starts playing within 1s of pressing play (streaming from Convex CDN).

## Acceptance Criteria
- User gets a shareable URL in ≤ 3 taps after recording.
- Link preview in iMessage/WhatsApp shows album art (or gradient) + song title.
- Recipient can play audio and read lyrics on the share page without signing in.
- Expired links show a clean message, not an error/crash.
- If share creation fails, user can still share raw audio.
- No regression to existing record/save flow.

## Implementation Plan
1. Create `web/` directory with a fresh Next.js app (`package.json`, `next.config.js`, `tsconfig.json`).
2. Add Convex to the project. Define `shares` table in `convex/schema.ts`.
3. Implement `createShare` mutation (file upload + doc insert + expiry).
4. Implement `getShare` public query (with expiry check).
5. Install Convex client in both Expo root and `web/` — each with their own `.env` pointing to the same Convex deployment.
6. Set `EXPO_PUBLIC_SHARE_BASE_URL=https://croon.app` in Expo `.env`.
7. Build app-side share flow: preflight → upload → mutation → share sheet with URL.
8. Add export state machine + entry points (post-recording + song detail).
9. Build `web/app/s/[shareId]/page.tsx`: SSR + OG tags + mini player component.
10. Implement lyric sync player (timed + fallback chunked).
11. Deploy `web/` to Vercel — set Root Directory to `web` in Vercel project settings.
12. Validate iOS/Android app flow + share page on iOS Safari and Android Chrome.

## Validation Checklist
- Share URL is generated and openable end-to-end.
- iMessage/WhatsApp shows rich link preview with correct title + image.
- Share page renders with album art + timed lyrics.
- Share page renders without album art (gradient fallback).
- Share page renders without timed lyrics (chunked fallback).
- Expired share shows clean 404/expired page.
- Upload failure surfaces retry + audio share fallback.
- Share page works on iOS Safari, Android Chrome.
