# PRD: Music Deep Linking from User Songs (MVP)

**Feature:** Open Song in Spotify / Apple Music / YouTube  
**Status:** Planned  
**Owner:** Saikat  
**Created:** 2026-03-14  
**Spec:** [spec-music-deep-linking-mvp.md](../spec/spec-music-deep-linking-mvp.md)

---

## 1. Why Are We Building This?

Users in LyricLoop are practicing songs they already know and love. After finding the lyrics and recording, the natural next step is to listen to the real track — to check their delivery, re-learn a section, or just enjoy the song. Right now there is no path from a song in LyricLoop to its playback anywhere; users have to manually open Spotify or Apple Music and search again.

This feature removes that friction. One tap from a song in LyricLoop opens it in the user's preferred music app, instantly. It makes LyricLoop feel connected to the broader music ecosystem rather than an isolated tool.

---

## 2. Goals

- Let users jump from any song in LyricLoop to Spotify, Apple Music, or YouTube in one tap.
- Minimise time between intent and playback — no extra steps, no auth walls.
- Fail gracefully for songs without provider links — never crash, never block.
- Ship with zero OAuth or playback-control complexity.

---

## 3. User Stories

**Quick jump to listening:**
> As a user, after reviewing my lyrics I want to tap "Open in Spotify" and hear the real track immediately, so I can compare my recording to the original.

**Provider choice:**
> As a user, I can choose whether to open the song in Spotify, Apple Music, or YouTube, depending on which app I have and prefer.

**Missing link fallback:**
> As a user, if a song has no link for my preferred provider, I see a brief message telling me the link is unavailable — the rest of the app keeps working normally.

**List-level shortcut:**
> As a user browsing my library, I can quickly jump into a song's playback app from the list item's action without needing to open the full song detail first.

---

## 4. Functional Requirements

### Data Model

1. Add an optional `externalLinks` field to the `Song` type:

```ts
type ExternalSongLinks = {
  spotify?: {
    uri?: string;  // spotify:track:...
    url?: string;  // https://open.spotify.com/track/...
  };
  appleMusic?: {
    url?: string;  // https://music.apple.com/...
  };
  youtube?: {
    url?: string;  // https://youtu.be/... or watch URL
  };
};
```

2. `externalLinks` must be optional at all levels — existing songs without the field must continue to work without any migration prompt or error.
3. `normalizeSongs` in `storage.ts` must handle `externalLinks: undefined` safely.

### Link Resolution (lib/openExternalMusicLink.ts)

4. Create a helper function `openExternalMusicLink(provider, song)` in `lib/`:
   - **Spotify:** try `spotify.uri` (native deep link) first; fall back to `spotify.url` (web); if neither exists, return `{ opened: false }`.
   - **Apple Music:** open `appleMusic.url` directly (iOS routes to app if installed); if absent, return `{ opened: false }`.
   - **YouTube:** open `youtube.url` directly; if absent, return `{ opened: false }`.
5. Use React Native `Linking.openURL` to open resolved URLs.
6. Return `{ opened: boolean }` so callers can show a toast when `opened === false`.
7. Never throw — wrap `Linking.openURL` in try/catch and return `{ opened: false }` on any error.

### Song Detail Screen

8. Add an "Open in…" button/menu on the song detail screen.
9. Tapping it shows an action sheet or inline menu with three options: Spotify, Apple Music, YouTube.
10. Tapping a provider calls `openExternalMusicLink` and dismisses the menu.
11. If `opened === false`, show a brief toast: `"Link not available for this song."`

### Song List Item

12. Add an "Open in…" action to the song list item's quick actions (action sheet or swipe-to-reveal, consistent with existing list item patterns).
13. Tapping it presents the same three-provider choice and follows the same toast behaviour as requirement 11.

### Error Handling

14. Missing link: toast only — `"Link not available for this song."` No navigation change, no modal.
15. Malformed URL or `Linking.openURL` failure: same toast, no crash.
16. Offline: `Linking.openURL` will fail silently or show OS error; show the same generic toast if caught.

---

## 5. Non-Goals (Out of Scope)

- In-app playback control (play/pause/seek).
- Spotify, Apple Music, or Google OAuth.
- Fetching or resolving provider links at runtime from the app (Spotify Search API, Apple catalog API, etc.).
- Syncing lyrics display with external player state.
- Storing provider links automatically during song search — `externalLinks` must be populated by the caller (e.g. song search flow or manual entry in a future iteration).
- Any provider-specific icon branding beyond a text label (unless trivially available in existing assets).

---

## 6. Design Considerations

- "Open in…" entry point should feel lightweight — a small icon button or a text action row, not a prominent CTA that competes with the recording flow.
- The three-option menu should match the existing action sheet style used elsewhere in the app.
- Toast copy: `"Link not available for this song."` — plain, non-alarming.
- No empty state screens or modals for missing links; toast only.

---

## 7. Technical Considerations

- React Native `Linking.openURL` handles both native app deep links and web URL fallbacks — no additional package needed.
- `spotify:track:...` URIs open the Spotify app directly on iOS/Android if installed; `https://open.spotify.com/track/...` is the web fallback.
- `https://music.apple.com/...` URLs are handled by iOS's universal link routing — the app opens if installed.
- `externalLinks` fields being optional must be enforced at the TypeScript type level, not just at runtime, to catch missing handling at compile time.
- The helper function lives in `lib/` following the existing pattern (`lib/lyricsSync.ts`, `lib/useLyricsLookup.ts`).
- No changes to the network layer are required for MVP — link resolution is deferred to a future iteration.

---

## 8. Success Metrics (Real User Feedback)

- A user taps "Open in Spotify" on a song that has a Spotify link and lands in the Spotify track in under 3 seconds.
- A user reports they no longer have to manually search in Spotify after a LyricLoop session.
- When a link is unavailable, the user sees the toast and continues using the app without confusion.
- At least 2 out of 3 beta users who try the feature find it useful enough to use again on their next session.

---

## 9. Open Questions

- When and how are `externalLinks` populated per song? The PRD deliberately defers this — the next iteration needs to define whether it's during the iTunes search flow, manual user entry, or a background lookup.
- Should we show provider icons (Spotify green, Apple Music badge, YouTube red)? Not required for MVP but worth confirming with design before building.
- Should unavailable providers be hidden from the menu or shown greyed-out? Current decision: show toast after tap (all three always visible). Revisit if user feedback indicates confusion.
