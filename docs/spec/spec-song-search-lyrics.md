# Apple Search + LRCLIB Lyrics Integration Spec

## Goal
Implement a 2-step song creation flow in **SongBuddy**:
1. Search/select song using iTunes Search API.
2. Auto-fetch lyrics from LRCLIB when possible.
3. Use LRCLIB synced timestamps (when available) for sing-along visualization.

Manual paste/edit must always remain available.

## Scope
- In scope: Apple song search, LRCLIB lyrics lookup, prefill song name + lyrics.
- In scope: parse/use `syncedLyrics` for line highlight + timestamp-driven scroll in record/sing-along UI.
- Out of scope: guaranteed lyrics availability (fallback to manual entry).

---

## High-level Flow

1. User taps `+` in library.
2. `app/song/search.tsx` opens and searches Apple (`itunes.apple.com/search`).
3. User selects a track.
4. App attempts LRCLIB lookup in this order:
   - exact-ish lookup via `/api/get-cached`
   - fallback keyword lookup via `/api/search`
5. App routes to `app/song/new.tsx` with:
   - prefilled name (`"{title} - {artist}"`)
   - prefilled lyrics if found
6. User can edit/replace lyrics manually and continue normal flow.

---

## API Contracts

## 1) Apple Search API

### Endpoint
```http
GET https://itunes.apple.com/search
```

### Query params
| Param | Required | Value |
|---|---|---|
| `term` | Yes | user query |
| `entity` | Yes | `song` |
| `media` | No | `music` |
| `limit` | No | `10` |
| `country` | No | `IN` (default for this app), optional user locale |

### Example
```text
https://itunes.apple.com/search?term=chand+sifarish&entity=song&media=music&limit=10&country=IN
```

## 2) LRCLIB API

### Endpoint A (first attempt)
```http
GET https://lrclib.net/api/get-cached
```

Query params:
- `track_name` (required)
- `artist_name` (required)
- `album_name` (required)
- `duration` (required, seconds)

### Endpoint B (fallback search)
```http
GET https://lrclib.net/api/search
```

Query params:
- `track_name` (recommended)
- `artist_name` (recommended)
- optional `q`

Use first best match from `/api/search`, then optionally fetch by id:

```http
GET https://lrclib.net/api/get/{id}
```

### Lyrics preference rule
Use `plainLyrics` for editor prefill. Use `syncedLyrics` for visualization/sing-along whenever present.

---

## Data Model

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

type LRCLibTrack = {
  id: number;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  plainLyrics: string;
  syncedLyrics: string;
  instrumental: boolean;
};
```

---

## Hook Specs

## `lib/useSongSearch.ts`
Keep existing implementation for Apple search (debounce + abort in-flight requests).

## `lib/useLyricsLookup.ts` (new)

### Behavior
- Input: selected `SongSearchResult`.
- Convert duration: `Math.round(durationMs / 1000)`.
- Attempt `/api/get-cached` first.
- If not found, run `/api/search` using `track_name` + `artist_name`.
- Return best match `plainLyrics` if available.
- Return `syncedLyrics` too when available.
- Never block user: on failure return `{ plainLyrics: null, source: 'manual' }`.

### Reference signature
```ts
export async function lookupLyricsForTrack(
  track: SongSearchResult
): Promise<LyricsLookupResult>
```

## `lib/lyricsSync.ts` (new)

### Behavior
- Parse LRCLIB LRC format (e.g. `[01:23.45] line text`) into `SyncedLyricLine[]`.
- Ignore invalid rows safely.
- If no valid timestamps, return empty list.

### Reference signature
```ts
export function parseSyncedLyrics(lrc: string | null): SyncedLyricLine[]
```

---

## UI Integration

## `app/song/search.tsx`
- Search input + list (Apple results).
- On row tap:
  - show temporary loading state: `Finding lyrics...`
  - call LRCLIB lookup
  - navigate to `/song/new` with params:
    - `prefillName`
    - `prefillLyrics` (optional)
    - `lyricsSource` (`lrclib` or `manual`)

## `app/song/new.tsx` / `SongEditorScreen`
- Read incoming params.
- Prefill `name` always.
- Prefill lyrics only if non-empty.
- Show subtle helper text when auto-filled: `Lyrics auto-filled from LRCLIB. You can edit.`
- Always allow full manual edit/paste.

## `app/song/record/[id].tsx` (or current recording screen)
- If parsed synced lines exist, drive active lyric line by elapsed recording time.
- Highlight active line and keep next lines readable.
- If synced lyrics are unavailable, use existing speed-based auto-scroll flow.

---

## Fallback Rules (MVP critical)

- If Apple search fails: allow direct manual song creation.
- If LRCLIB returns no lyrics: continue with empty lyrics box.
- If LRCLIB returns instrumental: keep lyrics empty and allow manual entry.
- If LRCLIB returns only `plainLyrics` (no `syncedLyrics`): keep existing speed-based auto-scroll.
- Never block “Record” beyond existing rule (`lyrics.trim().length > 0`).

---

## Sync Notes / Constraints

- Timestamp sync is most reliable against app-controlled elapsed time.
- For the current SongBuddy flow (recording user voice while external music may be playing), sync can drift from external audio.
- MVP approach: synced lyrics are a visual guide, not guaranteed beat-perfect alignment.

---

## Reliability Notes

- iTunes may return covers/remasters; show title + artist + album in list.
- LRCLIB is open and no-key, but should be treated as best-effort (no SLA in app).
- Normalize strings before matching if needed (trim, lowercase, remove extra punctuation).

---

## Validation Checklist

- Apple search for `"chand sifarish"` shows the expected Fanaa track.
- Selecting that track auto-fills lyrics from LRCLIB (when available).
- If `syncedLyrics` is present, active line highlighting advances during recording.
- If `syncedLyrics` is missing, fallback speed-based scroll still works.
- If LRCLIB lookup is forced to fail, manual flow still works.
- Song editor allows user to overwrite auto-filled lyrics.
- Existing save + record flow remains unchanged.

---

## Implementation Order

1. Keep `useSongSearch` as-is.
2. Add `useLyricsLookup` + LRCLIB client helpers.
3. Build/update `app/song/search.tsx` selection flow.
4. Wire prefill params into `SongEditorScreen`.
5. Add `parseSyncedLyrics` utility and record-screen line highlighting.
6. Validate happy path + fallback path on device.
