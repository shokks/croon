# PRD: Apple Search + LRCLIB Lyrics Integration

**Feature:** Song Search & Auto-Lyrics  
**Spec:** [docs/spec/spec-song-search-lyrics.md](./spec/spec-song-search-lyrics.md)  
**Status:** Ready for implementation  
**Created:** 2026-03-13

---

## 1. Why Are We Building This?

Right now, users have to paste or type lyrics manually — which is the biggest friction point before they can hit Record. Most users already know the song they want to practice; they just want to get the words on screen fast.

This feature lets users search for a song by name, auto-fills the title and lyrics in one tap, and — when synced lyrics are available — advances the active line in real time during recording so the user always knows where they are. It transforms LyricLoop from "paste your own lyrics app" into "find any song and practice in 30 seconds."

---

## 2. Goals

- Reduce time from app open to first recording for a known song from ~2 min to <30 seconds.
- Auto-fill lyrics for any song where LRCLIB has coverage, with zero manual copy-paste.
- Provide a time-synced line highlight during recording when `syncedLyrics` are available.
- Never block users from manual entry — search is an accelerator, not a gate.

---

## 3. User Stories

**Search & fill:**
> As a user, I tap + and search for the song I want to practice. I see a list of matching tracks. I tap the one I want, the lyrics load automatically, and I'm taken straight to the editor with everything pre-filled — ready to hit Record.

**Synced sing-along:**
> As a user recording with synced lyrics, I can see which line I should be singing right now, highlighted clearly, so I never lose my place mid-take.

**Manual fallback:**
> As a user whose song isn't found, I tap "Skip / enter manually" and arrive at a blank song editor — exactly like before — with no dead ends.

---

## 4. Functional Requirements

### Search Screen (`app/song/search.tsx`)

1. Replace the direct `/song/new` navigation from the library `+` button with navigation to `/song/search`.
2. Display a text input at the top, auto-focused on mount.
3. Debounce search input by 300ms before firing the iTunes API request.
4. Query `https://itunes.apple.com/search` with `entity=song&media=music&limit=10` and a country code derived from the device locale at runtime (e.g. `Localization.getLocales()[0].regionCode ?? 'US'`).
5. Display results as a scrollable list, each row showing: song title (bold), artist name, album name.
6. Show a "Skip / enter manually" text link below the search input (always visible) that navigates to `/song/new` with no prefill params.
7. On row tap:
   - Show an inline loading state on that row: replace the row content with `"Finding lyrics…"`.
   - Call LRCLIB lookup (see §4 Lyrics Lookup).
   - Navigate to `/song/new` passing `prefillName`, `prefillLyrics` (optional), and `lyricsSource` as route params.
8. If iTunes API call fails or returns no results, show a plain message: `"No results. Try a different search or skip to enter manually."` — the skip link remains tappable.

### Lyrics Lookup (`lib/useLyricsLookup.ts`)

9. Attempt `GET https://lrclib.net/api/get-cached` with `track_name`, `artist_name`, `album_name`, `duration` (in seconds, rounded).
10. If that returns 404 or no `plainLyrics`, fall back to `GET https://lrclib.net/api/search?track_name=…&artist_name=…` and use the first result.
11. If the result is marked `instrumental: true`, treat as no lyrics found.
12. Return `{ plainLyrics, syncedLyrics, source: 'lrclib' }` on success.
13. On any network error or empty result, return `{ plainLyrics: null, syncedLyrics: null, source: 'manual' }` — never throw, never block.

### Song Editor Prefill (`SongEditorScreen`)

14. Accept `prefillName`, `prefillLyrics`, and `lyricsSource` as optional incoming params (via Expo Router's `useLocalSearchParams`).
15. On mount, if `prefillName` is present, populate the song name input with it.
16. If `prefillLyrics` is non-empty, populate the lyrics field with it.
17. If `lyricsSource === 'lrclib'`, display a subtle single-line helper below the lyrics area: `"Lyrics auto-filled — tap to edit."` This disappears as soon as the user edits the lyrics.
18. All prefilled content is fully editable. Auto-save behaviour is unchanged.

### Synced Lyrics Parsing (`lib/lyricsSync.ts`)

19. Export `parseSyncedLyrics(lrc: string | null): SyncedLyricLine[]`.
20. Parse lines matching the LRC format `[mm:ss.xx] text` into `{ ms: number, text: string }[]`, sorted ascending by `ms`.
21. Skip any line that does not match the timestamp pattern (e.g. metadata tags).
22. If `lrc` is null or produces zero valid lines, return `[]`.

### Recording Screen — Synced Line Highlight

> **Implementation note:** `LyricsScrollView` already renders each line individually, tracks per-line Y offsets, highlights the active line, and smooth-scrolls to keep it centred. The only change needed is externalising the source of `currentLineIndex` — no new rendering pipeline is required.

23. Add two optional props to the existing `LyricsScrollView`: `syncedLines?: SyncedLyricLine[]` and `currentMs?: number`.
24. When `syncedLines` is provided and non-empty, use `syncedLines[i].text` as line content (instead of `lyrics.split('\n')`), and skip `useAutoScroll`'s timer output entirely.
25. Derive active line index from: last index `i` where `syncedLines[i].ms ≤ currentMs`. All existing per-line layout tracking, smooth-scroll, and centre-guide logic is reused unchanged.
26. Active line: `Palette.textPrimary` at opacity 1 (same as existing `activeLine` style).
27. Non-active lines (both past and future): uniform opacity 0.4. The past/future visual distinction is dropped in synced mode — timestamp advancement makes it irrelevant.
28. Tap-to-pause behaviour, pause badge, and center guide are preserved unchanged.
29. When `syncedLines` is empty or not provided, the component behaves exactly as before — speed-based auto-scroll, no regression.
30. `RecordingScreen` passes `syncedLines` and `currentMs={elapsedSeconds * 1000}` to `LyricsScrollView` only when parsed synced lines are non-empty.
31. Drift from external audio is accepted as-is for MVP. No manual correction mechanism.

---

## 5. Non-Goals (Out of Scope)

- No guaranteed lyrics availability — LRCLIB is best-effort.
- No beat-perfect audio sync — timestamps are a visual guide only.
- No caching of LRCLIB responses between sessions.
- No user-facing error messages for LRCLIB failures — the flow just falls through to manual entry.
- No album artwork display in search results (artworkUrl stored in type but not shown in this iteration).
- No editing of synced timestamps by the user.

---

## 6. Design Considerations

- **Search screen**: match existing dark theme (`Palette.background`, `Palette.surface` cards). Input field style consistent with `nameInput` in `SongEditorScreen`.
- **Loading state on row tap**: replace row text with `"Finding lyrics…"` in `Palette.textSecondary`. Do not show a spinner overlay.
- **Skip link**: `DM-Sans`, `Palette.accent` colour, positioned below the search input as a small text link — not a button.
- **LRCLIB helper text**: `DM-Sans`, `Palette.textDisabled`, `fontSize: 13`, shown directly below the lyrics area. No icon needed.
- **Active line style**: `Palette.textPrimary` at opacity 1. Non-active lines (all others) at uniform opacity 0.4 in synced mode — the past/future distinction used in speed-based mode is dropped. No colour or size change — only brightness. Transition between lines should be instant (no fade animation) to stay readable mid-song.

---

## 7. Technical Considerations

- Use `expo-localization` (`Localization.getLocales()`) to derive the iTunes `country` param — already likely installed via Expo. If not available, default to `'US'`.
- `syncedLyrics` should be stored on the `Song` type (optional `string | null` field on `SongRecording` or a top-level field on `Song`) so it survives session and can be used on the record screen without re-fetching.
- Both LRCLIB endpoints are no-auth, no-key. Treat them as public CDN-level calls.
- The existing `useSongSearch` hook is kept as-is per spec.
- `parseSyncedLyrics` must be pure (no side effects) and tested manually with sample LRC strings.
- All new network calls should use `AbortController` to cancel in-flight requests on unmount.

---

## 8. Success Metrics (Real User Feedback)

- A user searches for a song they know, selects it, and reaches a pre-filled editor in under 15 seconds without any confusion.
- A user with synced lyrics completes a full take without losing their place in the lyrics.
- A user whose song has no LRCLIB lyrics reaches the blank editor via "Skip" and records normally — they do not report feeling stuck.
- At least 2 out of 3 beta users say the search flow saves them meaningful time vs. manual paste.

---

## 8. Open Questions

- Should `syncedLyrics` be stored on `Song.recording` or as a top-level `Song` field? (Top-level makes more sense since lyrics belong to the song, not a specific take — but needs a types change.)
- Should the search screen be accessible from the song editor too (e.g. a "Search for lyrics" button when the lyrics area is empty), or only from the library `+` button for now?
