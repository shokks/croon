# Tasks: Song Search + Auto-Lyrics (iTunes + LRCLIB)

**PRD:** [docs/prd-song-search-lyrics.md](../prd-song-search-lyrics.md)  
**Spec:** [docs/spec/spec-song-search-lyrics.md](../spec/spec-song-search-lyrics.md)  
**Created:** 2026-03-13

---

## Relevant Files

- `types/index.ts` - Add `SongSearchResult`, `LyricsLookupResult`, `SyncedLyricLine`; add `syncedLyrics?: string | null` to `Song`
- `lib/storage.ts` - Update `normalizeSongs` and `saveSong` to persist `syncedLyrics`
- `lib/useSongSearch.ts` - New: debounced iTunes search hook
- `lib/useLyricsLookup.ts` - New: LRCLIB get-cached + search fallback
- `lib/lyricsSync.ts` - New: `parseSyncedLyrics()` LRC parser
- `app/song/search.tsx` - New: search screen
- `app/song/new.tsx` - Read incoming prefill params and forward to `SongEditorScreen`
- `app/index.tsx` - Change `+` navigation target from `/song/new` to `/song/search`
- `app/_layout.tsx` - Register `song/search` route in Stack
- `components/SongEditorScreen.tsx` - Accept prefill props; show LRCLIB helper text
- `components/LyricsScrollView.tsx` - Add optional `syncedLines`/`currentMs` props; derive active index from timestamps when present; reuse all existing per-line layout, smooth-scroll, and highlight infrastructure
- `components/RecordingScreen.tsx` - Detect `syncedLyrics` on load; switch scroll mode

### Notes

- No automated tests — validate manually on device.
- All new network calls must use `AbortController` for in-flight cancellation on unmount.
- `expo-localization` is included in the Expo SDK 54 and can be imported directly — no separate install needed. Verify with a quick import test.
- `syncedLyrics` lives on `Song` (top-level), not on `SongRecording` — lyrics belong to the song, not a specific take.

---

## Instructions for Completing Tasks

As you complete each sub-task, change `- [ ]` to `- [x]`. Update after each sub-task, not after the whole parent.

Do not move to the next parent task until the user explicitly confirms the current one works on device.

Each parent task lifecycle: branch → implement → verify on device → user approval → commit → merge to main → delete branch.

---

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 `git checkout main && git pull && git checkout -b feature/8-song-search-lyrics` (~5 min)

---

- [x] 1.0 Update types and storage layer
  - [x] 1.1 In `types/index.ts`, add the three new types (~15 min):
    ```ts
    export type SongSearchResult = {
      id: number;
      title: string;
      artist: string;
      album: string;
      artworkUrl: string;
      previewUrl: string | null;
      durationMs: number;
    };

    export type LyricsLookupResult = {
      plainLyrics: string | null;
      syncedLyrics: string | null;
      source: 'lrclib' | 'manual';
    };

    export type SyncedLyricLine = {
      ms: number;
      text: string;
    };
    ```
  - [x] 1.2 Add optional `syncedLyrics?: string | null` field to the `Song` type (~5 min)
  - [x] 1.3 In `lib/storage.ts`, update `normalizeSongs` — add `syncedLyrics` to the field-pass-through in the `.map()` so it is preserved when reading from AsyncStorage (~10 min):
    ```ts
    // Inside the .map() in normalizeSongs:
    return {
      ...candidate,
      recording: normalizeRecording(candidate.recording),
      syncedLyrics: typeof (candidate as Song & { syncedLyrics?: unknown }).syncedLyrics === 'string'
        ? (candidate as Song & { syncedLyrics?: string }).syncedLyrics
        : undefined,
    };
    ```
  - [x] 1.4 Verify: run `npx tsc --noEmit` — zero type errors (~5 min)
  - [ ] 1.5 Get user approval

---

- [x] 2.0 Build lyrics utilities
  - [x] 2.1 Create `lib/lyricsSync.ts` — pure LRC parser (~30 min):
    - Export `parseSyncedLyrics(lrc: string | null): SyncedLyricLine[]`
    - Regex: `/^\[(\d{2}):(\d{2})\.(\d{2,3})\]\s*(.*)$/`
    - Convert `[mm:ss.xx]` → `ms = mm*60000 + ss*1000 + xx*10` (or `xx` as-is if 3 digits)
    - Skip lines that don't match (metadata tags, empty lines)
    - Return array sorted ascending by `ms`
    - Return `[]` on null input or zero valid lines
  - [x] 2.2 Manually test `parseSyncedLyrics` with a sample LRC string in a `console.log` call — remove after verifying (~10 min)
  - [x] 2.3 Create `lib/useLyricsLookup.ts` — export a single async function (not a hook) (~45 min):
    ```ts
    export async function lookupLyricsForTrack(
      track: SongSearchResult,
      signal?: AbortSignal
    ): Promise<LyricsLookupResult>
    ```
    - Step 1: `GET https://lrclib.net/api/get-cached?track_name=…&artist_name=…&album_name=…&duration=…`
      (duration = `Math.round(track.durationMs / 1000)`)
    - Step 2: If response is 404 or has no `plainLyrics`, fall back to `GET https://lrclib.net/api/search?track_name=…&artist_name=…` and take `results[0]`
    - Step 3: If result has `instrumental: true`, return manual fallback
    - Step 4: Return `{ plainLyrics: result.plainLyrics ?? null, syncedLyrics: result.syncedLyrics ?? null, source: 'lrclib' }`
    - Catch-all: any thrown error → return `{ plainLyrics: null, syncedLyrics: null, source: 'manual' }`
    - Pass `signal` to all `fetch` calls so they are cancelled by the caller when needed
  - [x] 2.4 Verify: call `lookupLyricsForTrack` manually from a `useEffect` in `app/song/new.tsx` with a hardcoded test track (e.g. title="Chand Sifarish", artist="Shaan") — `console.log` the result — remove after confirming lyrics come back (~15 min)
  - [x] 2.5 Get user approval

---

- [x] 3.0 Build the search screen
  - [x] 3.1 Verify `expo-localization` is importable: add `import { getLocales } from 'expo-localization';` to any file and run — if it throws, run `npx expo install expo-localization` (~5 min)
  - [x] 3.2 Create `lib/useSongSearch.ts` — debounced iTunes search hook (~45 min):
    ```ts
    export function useSongSearch(): {
      query: string;
      setQuery: (q: string) => void;
      results: SongSearchResult[];
      isLoading: boolean;
      error: string | null;
    }
    ```
    - Debounce `query` by 300ms before firing
    - On each debounced query change, cancel in-flight request via `AbortController`
    - Derive `country` from `getLocales()[0]?.regionCode ?? 'US'`
    - Fetch `https://itunes.apple.com/search?term=…&entity=song&media=music&limit=10&country=…`
    - Map each iTunes result to `SongSearchResult` (fields: `trackId→id`, `trackName→title`, `artistName→artist`, `collectionName→album`, `artworkUrl100→artworkUrl`, `previewUrl`, `trackTimeMillis→durationMs`)
    - On empty query: clear results, no fetch
    - On fetch error (excluding AbortError): set `error` message, keep previous results
  - [x] 3.3 Create `app/song/search.tsx` screen (~1 hr):
    - Use `useSongSearch` hook
    - `TextInput` at top, `autoFocus`, style matches `nameInput` in `SongEditorScreen`
    - "Skip / enter manually" accent link directly below the input — always visible — navigates to `/song/new`
    - `FlatList` of results below the skip link
    - Each result row: `title` bold (`DM-Sans-SemiBold`, 16sp), `artist · album` on second line (`DM-Sans`, 13sp, `textSecondary`)
    - Row separators: hairline `Palette.border`
    - No results + no error + non-empty query: show `"No results. Try a different search or skip to enter manually."` in `textSecondary`
    - Network error: show the same message
    - On row tap:
      1. Mark that row as loading (show `"Finding lyrics…"` in place of artist/album text)
      2. Create `AbortController`, call `lookupLyricsForTrack(track, controller.signal)`
      3. Navigate to `/song/new` with params: `prefillName` (`"${title} — ${artist}"`), `prefillLyrics` (if non-null), `lyricsSource` (`'lrclib'` or `'manual'`), `prefillSyncedLyrics` (if non-null)
      4. Cancel the controller on component unmount to avoid state updates after navigate
  - [x] 3.4 Register the route in `app/_layout.tsx`:
    ```tsx
    <Stack.Screen name="song/search" options={{ title: 'Find a Song' }} />
    ```
    (~5 min)
  - [x] 3.5 In `app/index.tsx`, change the FAB `onPress` to navigate to `/song/search` instead of `/song/new` (~5 min)
  - [x] 3.6 Verify on device: tap `+` → search screen opens; type "chand sifarish" → Fanaa track appears; tap Skip → blank editor opens; tap a result → "Finding lyrics…" shows briefly → editor opens with name pre-filled (~20 min)
  - [x] 3.7 Get user approval

---

- [x] 4.0 Wire prefill params into SongEditorScreen
  - [x] 4.1 Update `app/song/new.tsx` to read params and forward them to `SongEditorScreen` (~15 min):
    ```tsx
    import { useLocalSearchParams } from 'expo-router';

    export default function NewSongScreen() {
      const { prefillName, prefillLyrics, lyricsSource, prefillSyncedLyrics } =
        useLocalSearchParams<{
          prefillName?: string;
          prefillLyrics?: string;
          lyricsSource?: 'lrclib' | 'manual';
          prefillSyncedLyrics?: string;
        }>();
      return (
        <SongEditorScreen
          prefillName={prefillName}
          prefillLyrics={prefillLyrics}
          lyricsSource={lyricsSource}
          prefillSyncedLyrics={prefillSyncedLyrics}
        />
      );
    }
    ```
  - [x] 4.2 Update `SongEditorScreen` props type to accept the four new optional fields (~5 min)
  - [x] 4.3 In `SongEditorScreen`, on mount (inside the existing new-song `useEffect` branch where `!songId`), apply prefill values to state and refs (~20 min):
    - Set `name` state + `nameRef.current` to `prefillName` if provided
    - Set `lyrics` state + `lyricsValueRef.current` to `prefillLyrics` if provided and non-empty
    - Store `prefillSyncedLyrics` in a ref (`syncedLyricsRef`) so it can be persisted on first save
  - [x] 4.4 On the first `doSave` call for a prefilled song, include `syncedLyrics: syncedLyricsRef.current ?? undefined` in the saved `Song` object (~15 min)
  - [x] 4.5 Add the LRCLIB helper text below the lyrics area — visible only when `lyricsSource === 'lrclib'` AND the user hasn't yet edited the lyrics (~20 min):
    - Track an `isPrefilled` boolean state, initially `true` when `lyricsSource === 'lrclib'`
    - On first `handleLyricsChange` call when `isPrefilled` is true, set `isPrefilled = false`
    - Render below `lyricsContainer` (above `miniPlayer`):
      ```tsx
      {isPrefilled && (
        <Text style={styles.prefillHelper}>Lyrics auto-filled — tap to edit.</Text>
      )}
      ```
    - Style: `DM-Sans`, `fontSize: 13`, `color: Palette.textDisabled`, `paddingHorizontal: 20`, `paddingVertical: 8`
  - [x] 4.6 Verify on device: select a song from search → editor opens with name and lyrics pre-filled → helper text visible → edit one character → helper text disappears → save → song appears in library with correct name (~15 min)
  - [x] 4.7 Get user approval

---

- [ ] 5.0 Build synced-line highlight in the recording screen
  > **Context:** `LyricsScrollView` already renders each line individually, tracks per-line Y offsets in `lineOffsetsRef`, smooth-scrolls to keep the active line centred, and dims past/future lines. The only work needed is (a) externalising the index source and (b) switching to uniform 0.4 opacity for non-active lines in synced mode. Do NOT rebuild the rendering pipeline.

  - [x] 5.1 In `LyricsScrollView.tsx`, add two optional props (~5 min):
    ```ts
    syncedLines?: SyncedLyricLine[];
    currentMs?: number;
    ```
  - [x] 5.2 When `syncedLines` is non-empty, replace `lines` (from `lyrics.split('\n')`) with `syncedLines.map(l => l.text)` for rendering (~10 min):
    - Wrap the existing `useMemo` for `lines` with a branch: if `syncedLines?.length`, use those texts; else split `lyrics`
    - This is the only content change — all `onLayout`, `lineOffsetsRef`, and `smoothScrollTo` code is reused as-is
  - [x] 5.3 When `syncedLines` is non-empty, derive `currentLineIndex` from timestamps instead of `useAutoScroll` (~20 min):
    - Compute inside a `useMemo`: last index `i` where `syncedLines[i].ms <= (currentMs ?? 0)`
    - Replace the `currentLineIndex` value used in the render with this computed index (keep the `useAutoScroll` call for the fallback path but ignore its output when synced mode is active)
    - Apply uniform `opacity: 0.4` to all non-active lines (replace the separate `pastLine`/`futureLine` styles when in synced mode)
  - [x] 5.4 When `syncedLines` is empty or undefined, component behaves exactly as before — speed-based auto-scroll, past/future opacity — no regression (~5 min — confirm by reading through the code paths)
  - [x] 5.5 In `RecordingScreen.tsx`, load `syncedLyrics` from the song on mount alongside existing `lyrics`/`scrollSpeed` (~15 min):
    - Add `syncedLyrics` state: `const [syncedLyrics, setSyncedLyrics] = useState<string | null>(null)`
    - In the existing `getSongs` effect: `setSyncedLyrics(song.syncedLyrics ?? null)`
  - [x] 5.6 Parse into `SyncedLyricLine[]` with a memoised call to `parseSyncedLyrics` (~5 min):
    - `const syncedLines = useMemo(() => parseSyncedLyrics(syncedLyrics), [syncedLyrics])`
  - [x] 5.7 Pass `syncedLines` and `currentMs` to `LyricsScrollView` in the recording render (~10 min):
    ```tsx
    <LyricsScrollView
      lyrics={lyrics}
      scrollSpeed={scrollSpeed}
      syncedLines={syncedLines.length > 0 ? syncedLines : undefined}
      currentMs={syncedLines.length > 0 ? elapsedSeconds * 1000 : undefined}
    />
    ```
  - [ ] 5.8 Verify on device: search and select a song that returns synced lyrics (try "Chand Sifarish" by Shaan) → record → confirm active line advances as time elapses and all other lines are at 0.4 opacity; also verify a manual song (no synced lyrics) still auto-scrolls with past/future dimming unchanged (~20 min)
  - [ ] 5.9 Get user approval

---

- [ ] 6.0 E2E validation, merge, and roadmap update
  - [ ] 6.1 Full happy path on device (~20 min):
    - Open app → tap + → search "Chand Sifarish" → select track → lyrics auto-fill → helper text visible → tap Start Recording → synced lines highlight as time advances → stop → play back → done
  - [ ] 6.2 Fallback path — no lyrics (~10 min):
    - Search a song likely not in LRCLIB (e.g. an obscure track) → select it → editor opens with name pre-filled, lyrics empty, no helper text → enter lyrics manually → record normally
  - [ ] 6.3 Skip path (~5 min):
    - Tap + → tap "Skip / enter manually" → blank editor opens → full flow works as before
  - [ ] 6.4 Run `npm run lint` and `npx tsc --noEmit` — zero errors (~5 min)
  - [ ] 6.5 Commit, merge to main, delete branch (~10 min):
    ```
    git add -A
    git commit -m "Add song search + auto-lyrics (iTunes + LRCLIB + synced line highlight)"
    git checkout main && git merge --no-ff feature/8-song-search-lyrics
    git branch -d feature/8-song-search-lyrics
    ```
  - [ ] 6.6 Update `docs/roadmap.md` — mark Song Search + Auto-Lyrics as ✅ Complete with today's date (~5 min)
  - [ ] 6.7 Get user approval
