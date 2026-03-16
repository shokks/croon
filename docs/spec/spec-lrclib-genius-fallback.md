# LRCLIB → Genius Fallback Lyrics Search (MVP Spec)

## Goal
Add a backup lyrics search path using **Genius** when LRCLIB returns no usable lyrics, while preserving current manual-entry flow.

## Scope
- In scope: fallback lookup trigger, Genius search integration, lyric extraction from Genius song pages, prefill in song editor.
- In scope: Hindi/Bollywood-friendly matching heuristics for better search quality.
- Out of scope: perfect 100% lyric coverage, synced timestamp support from Genius.

---

## Product Behavior

1. User selects a track from Apple search.
2. App tries LRCLIB first (existing behavior).
3. If LRCLIB returns no `plainLyrics` (or empty), app automatically tries Genius fallback.
4. If Genius yields lyrics, prefill lyrics editor and mark source as `genius`.
5. If Genius also fails, keep current manual entry flow with no blocking.

---

## Fallback Trigger Rules

Run Genius fallback only when at least one is true:
- LRCLIB request returns not found / empty payload.
- LRCLIB payload has `plainLyrics` missing or blank.
- LRCLIB marks track as instrumental.

Do **not** run Genius fallback when LRCLIB already has non-empty `plainLyrics`.

---

## Data Contract Changes

Update lyrics source type:

```ts
type LyricsSource = 'lrclib' | 'genius' | 'manual';

type LyricsLookupResult = {
  plainLyrics: string | null;
  syncedLyrics: string | null; // stays null for Genius path
  source: LyricsSource;
};
```

---

## Integration Design

## 1) Genius search API (metadata)

Use Genius search endpoint to find the best song candidate by title + artist.

```http
GET https://api.genius.com/search?q={track}+{artist}
Authorization: Bearer {GENIUS_ACCESS_TOKEN}
```

Expected usage:
- Parse top hits.
- Prefer hits where primary artist matches selected track artist (normalized compare).
- Prefer title similarity with selected track title.
- Extract `result.url` (Genius song page URL).

## 2) Lyrics extraction from Genius page

Since public API is primarily metadata-focused, fetch lyrics from the returned song page URL.

MVP extraction approach:
- Request HTML of `result.url`.
- Parse known Genius lyric containers (e.g. `data-lyrics-container="true"` blocks).
- Join cleaned lines into `plainLyrics`.
- If parse fails, treat as no result.

---

## New/Updated Modules

## `lib/useLyricsLookup.ts` (update)

Flow:
1. `lookupViaLRCLIB(track)`
2. If empty/missing, `lookupViaGenius(track)`
3. Return first successful lyrics result.
4. Else return `{ plainLyrics: null, syncedLyrics: null, source: 'manual' }`

Reference shape:

```ts
async function lookupViaGenius(track: SongSearchResult): Promise<LyricsLookupResult | null>
```

## `lib/genius.ts` (new)

Responsibilities:
- Build authorized Genius search request.
- Select best hit from response.
- Fetch Genius song page URL.
- Parse and normalize lyric text.

Suggested helpers:

```ts
export async function searchGeniusSongUrl(track: SongSearchResult): Promise<string | null>
export async function fetchGeniusLyrics(songUrl: string): Promise<string | null>
export async function lookupGeniusLyrics(track: SongSearchResult): Promise<string | null>
```

---

## Env / Config

Add env var:

```text
EXPO_PUBLIC_GENIUS_ACCESS_TOKEN=...
```

Rules:
- If token missing, skip Genius path silently and return existing LRCLIB/manual behavior.
- Never log token value.

---

## UI Notes

- Existing prefill behavior stays the same.
- If fallback succeeds, show helper text:
  - `Lyrics auto-filled from Genius. You can edit.`
- Manual editing remains fully enabled.

---

## Matching Heuristics (MVP)

To improve Hindi results:
- Normalize title/artist before matching (lowercase, trim, collapse spaces, strip common suffixes like `- remastered`, `(feat...)`).
- Prefer exact/near-exact artist match.
- If multiple hits score similarly, choose first hit.

No fuzzy-engine complexity beyond simple scoring in MVP.

---

## Error Handling

- Any Genius API/network/parse error should fail soft.
- Never block song creation.
- If both sources fail, user continues with empty lyrics box.

---

## Validation Checklist

- LRCLIB success case still uses LRCLIB only (no Genius call).
- LRCLIB failure case triggers Genius fallback automatically.
- Genius success pre-fills lyrics and sets source `genius`.
- Missing Genius token keeps app behavior unchanged.
- If Genius HTML parse fails, manual flow still works.
- No crashes in offline or timeout scenarios.

---

## Implementation Order

1. Add `genius.ts` client + parsing helpers.
2. Extend `useLyricsLookup.ts` with LRCLIB → Genius fallback chain.
3. Add source label handling (`genius`) in editor helper text.
4. Add env wiring and guard for missing token.
5. Validate LRCLIB success path, fallback success path, and total-failure manual path.
