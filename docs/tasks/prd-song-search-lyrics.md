# PRD: Apple Search + LRCLIB Lyrics Integration

**Feature:** Song Search, Auto-Lyrics & Library Artwork  
**Status:** Implemented ✅  
**Created:** 2026-03-13  
**Completed:** 2026-03-13

---

## 1. Why Are We Building This?

Right now, users have to paste or type lyrics manually — which is the biggest friction point before they can hit Record. Most users already know the song they want to practice; they just want to get the words on screen fast.

This feature lets users search for a song by name, auto-fills the title and lyrics in one tap, and — when synced lyrics are available — advances the active line in real time during recording so the user always knows where they are. It transforms Croon from "paste your own lyrics app" into "find any song and practice in 30 seconds."

Album artwork from iTunes is also stored on the song and displayed in the library, making the song list visually scannable without feeling like a social feed.

---

## 2. Goals

- Reduce time from app open to first recording for a known song from ~2 min to <30 seconds.
- Auto-fill lyrics for any song where LRCLIB has coverage, with zero manual copy-paste.
- Provide a time-synced line highlight during recording when `syncedLyrics` are available.
- Never block users from manual entry — search is an accelerator, not a gate.
- Use artwork to make the library visually distinct and personal without adding social-app energy.

---

## 3. User Stories

**Search & fill:**
> As a user, I tap + and search for the song I want to practice. I see a list of matching tracks. I tap the one I want, the lyrics load automatically, and I'm taken straight to the editor with everything pre-filled — ready to hit Record.

**Synced sing-along:**
> As a user recording with synced lyrics, I can see which line I should be singing right now, highlighted clearly, so I never lose my place mid-take.

**Manual fallback:**
> As a user whose song isn't found, I tap "Skip / enter manually" and arrive at a blank song editor — exactly like before — with no dead ends.

**Library at a glance:**
> As a returning user, I can see my songs in the library with their album art — I immediately know which song is which without reading titles.

---

## 4. Functional Requirements

### Search Screen (`app/song/search.tsx`)

1. Replace the direct `/song/new` navigation from the library `+` button with navigation to `/song/search`.
2. Display a text input at the top, auto-focused on mount.
3. Debounce search input by 300ms before firing the iTunes API request.
4. Query `https://itunes.apple.com/search` with `entity=song&media=music&limit=10` and a country code derived from the device locale at runtime (`getLocales()[0].regionCode ?? 'US'`).
5. Display results as a scrollable list, each row showing: song title (bold), artist · album on second line.
6. Show a "Skip / enter manually" text link below the search input (always visible) that navigates to `/song/new` with no prefill params.
7. On row tap:
   - Show an inline loading state on that row: replace the artist/album line with `"Finding lyrics…"` in accent colour.
   - Call LRCLIB lookup (see §4 Lyrics Lookup).
   - Navigate to `/song/new` via `router.replace` (not push) passing `prefillName`, `prefillLyrics`, `lyricsSource`, `prefillSyncedLyrics`, and `prefillArtworkUrl` as route params.
8. "Skip / enter manually" also uses `router.replace` — back from editor goes to Library, not back to search.
9. If iTunes API call fails or returns no results, show: `"No results. Try a different search or skip to enter manually."` — the skip link remains tappable.

### Album Artwork

10. iTunes `artworkUrl100` is upscaled to `300x300bb` (string replacement) before being passed as `prefillArtworkUrl`.
11. `artworkUrl` is added as an optional field to the `Song` type and persisted via `normalizeSongs` in `storage.ts`.
12. `SongEditorScreen` receives `prefillArtworkUrl`, stores it in `artworkUrlRef`, and includes it in every `saveSong` call.
13. When loading an existing song, `artworkUrlRef` is restored from `song.artworkUrl`.

### Lyrics Lookup (`lib/useLyricsLookup.ts`)

14. Attempt `GET https://lrclib.net/api/get-cached` with `track_name`, `artist_name`, `album_name`, `duration` (in seconds, rounded).
15. If that returns 404 or no `plainLyrics`, fall back to `GET https://lrclib.net/api/search?track_name=…&artist_name=…` and use the first result.
16. If the result is marked `instrumental: true`, treat as no lyrics found.
17. Return `{ plainLyrics, syncedLyrics, source: 'lrclib' }` on success.
18. On any network error or empty result, return `{ plainLyrics: null, syncedLyrics: null, source: 'manual' }` — never throw, never block.
19. All fetch calls receive an `AbortSignal` so they are cancelled on unmount/navigation.

### Song Editor Prefill (`SongEditorScreen`)

20. Accept `prefillName`, `prefillLyrics`, `lyricsSource`, `prefillSyncedLyrics`, and `prefillArtworkUrl` as optional props.
21. On mount (new song branch), set name/lyrics state and refs from prefill values.
22. **Eager save**: if any prefill data is present, immediately call `doSave()` on mount (after setting `createdAtRef`). This ensures the song exists in AsyncStorage before the user navigates back — eliminating the race condition where the library reloads before the save completes.
23. If `lyricsSource === 'lrclib'`, display a subtle helper below the lyrics area: `"Lyrics auto-filled — tap to edit."` Disappears on first lyrics edit.
24. All prefilled content is fully editable. Auto-save behaviour is unchanged.

### Synced Lyrics Parsing (`lib/lyricsSync.ts`)

25. Export `parseSyncedLyrics(lrc: string | null): SyncedLyricLine[]`.
26. Parse lines matching the LRC format `[mm:ss.xx] text` into `{ ms: number, text: string }[]`, sorted ascending by `ms`.
27. Skip any line that does not match the timestamp pattern (e.g. metadata tags).
28. If `lrc` is null or produces zero valid lines, return `[]`.

### Recording Screen — Synced Line Highlight

29. Add two optional props to `LyricsScrollView`: `syncedLines?: SyncedLyricLine[]` and `currentMs?: number`.
30. When `syncedLines` is provided, use `syncedLines[i].text` as line content and derive active index from timestamps (last `i` where `syncedLines[i].ms ≤ currentMs`). The beat-interval auto-scroll is bypassed entirely.
31. Non-active lines in synced mode: uniform opacity 0.4. Past/future distinction dropped — timestamp advancement makes it irrelevant.
32. When `syncedLines` is absent, component behaves exactly as before — no regression.
33. `RecordingScreen` loads `syncedLyrics` from the song, parses it, and passes `syncedLines` + `currentMs={elapsedSeconds * 1000}` to `LyricsScrollView`.

### Library Redesign (`SongListItem`)

34. Remove card backgrounds — rows sit on bare `Palette.background` with hairline separators (inset-left aligned with text, not full width).
35. Each row shows a 56×56 artwork thumbnail (borderRadius 8) on the left.
36. A warm `rgba(14,12,10,0.22)` tint overlay on the thumbnail blends it into the dark background.
37. Songs without artwork show a `surfaceRaised` placeholder with a dim music-note icon.
38. A small amber dot (5×5) in the bottom-right corner of the thumbnail indicates a recording exists (replaces the old 3px left accent bar).
39. Recording duration is shown inline in the meta row in accent colour, not in a separate badge.

---

## 5. Non-Goals (Out of Scope)

- No guaranteed lyrics availability — LRCLIB is best-effort.
- No beat-perfect audio sync — timestamps are a visual guide only.
- No caching of LRCLIB responses between sessions.
- No user-facing error messages for LRCLIB failures — falls through to manual entry.
- No editing of synced timestamps by the user.
- No artwork display in the song editor or recording screen (library only for now).

---

## 6. Design Considerations

- **Search screen**: dark theme, input style consistent with `nameInput` in `SongEditorScreen`. Loading state is inline text replacement, not a spinner overlay.
- **Skip link**: `DM-Sans`, `Palette.accent`, positioned as a small text link below the input — not a button.
- **LRCLIB helper**: `DM-Sans`, `Palette.textDisabled`, `fontSize: 13`. No icon.
- **Synced active line**: `Palette.textPrimary` at full opacity. All other lines uniform 0.4. No fade animation between lines.
- **Library artwork**: warm tint overlay, no card shadow, no border. Feels like a personal notebook, not a streaming app.

---

## 7. Technical Considerations

- `expo-localization` required for country code; installed via `npx expo install expo-localization` if not present.
- `syncedLyrics` and `artworkUrl` are top-level `Song` fields (not on `SongRecording`) — they belong to the song, not a specific take.
- Navigation from search uses `router.replace` so the search screen is removed from the stack on selection.
- Prefilled songs are saved eagerly on editor mount to avoid a race condition with the library's `useFocusEffect` reload.
- All network calls use `AbortController` for in-flight cancellation.

---

## 8. Success Metrics (Real User Feedback)

- A user searches for a song they know, selects it, and reaches a pre-filled editor in under 15 seconds without confusion.
- A user with synced lyrics completes a full take without losing their place.
- A user whose song has no LRCLIB lyrics reaches the blank editor via "Skip" and records normally.
- At least 2 out of 3 beta users say the search flow saves meaningful time vs. manual paste.
- Library with artwork feels personal and scannable without feeling like a social feed.
