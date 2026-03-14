# Tasks: Music Deep Linking from User Songs (MVP)

**PRD:** [prd-music-deep-linking-mvp.md](./prd-music-deep-linking-mvp.md)  
**Spec:** [spec-music-deep-linking-mvp.md](../spec/spec-music-deep-linking-mvp.md)  
**Branch:** `feature/music-deep-linking-mvp`

---

## Relevant Files

- `types/index.ts` — Add `ExternalSongLinks` type and `externalLinks` field to `Song`.
- `lib/storage.ts` — Update `normalizeSongs` to handle `externalLinks` safely.
- `lib/openExternalMusicLink.ts` — New helper: resolves and opens provider deep links via `Linking`.
- `components/SongEditorScreen.tsx` — Add "Open in…" button/menu to the song editor/detail view.
- `components/SongListItem.tsx` — Add "Open in…" action to the list item actions row.

### Notes

- No new packages are needed — `Linking` from React Native handles all URL opening.
- No network calls are required for MVP — `externalLinks` are populated by the caller (future iteration).
- Follow existing patterns in `lib/lyricsSync.ts` and `lib/useLyricsLookup.ts` for the helper structure.
- Follow existing action button style in `SongListItem` for the "Open in…" button.
- Toast for missing links: use the same pattern as any existing in-app feedback (check for `Alert` or toast usage in codebase; fallback to `Alert.alert` if no toast lib is available).

---

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, check it off by changing `- [ ]` to `- [x]`. Update after each sub-task, not just after the parent.

After each sub-task, run the most relevant validation (TypeScript check, manual test on simulator), then mark complete.

Do not proceed to the next parent task until the user confirms the current one works.

---

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 `git checkout -b feature/music-deep-linking-mvp`

- [x] 1.0 Extend Song type and storage normalization
  - [x] 1.1 Add `ExternalSongLinks` type and optional `externalLinks` field to `Song` in `types/index.ts`
  - [x] 1.2 Update `normalizeSongs` in `lib/storage.ts` to safely normalize `externalLinks` (pass through if valid object, set `undefined` otherwise)
  - [x] 1.3 Verify: TypeScript compiles with no errors; existing songs load without `externalLinks` without crashing

- [x] 2.0 Create `lib/openExternalMusicLink.ts` helper
  - [x] 2.1 Implement `openExternalMusicLink(provider, song)` with Spotify URI → URL fallback, Apple Music URL, YouTube URL resolution
  - [x] 2.2 Wrap `Linking.openURL` in try/catch; return `{ opened: boolean }`
  - [x] 2.3 Verify: TypeScript compiles; unit-test the resolution logic manually with a song that has mock `externalLinks`

- [x] 3.0 Add "Open in…" to SongEditorScreen
  - [x] 3.1 Add an "Open in…" button to the editor header or action area (lightweight, does not compete with the record flow)
  - [x] 3.2 Tapping shows an `ActionSheetIOS` / `Alert.alert` with Spotify, Apple Music, YouTube options
  - [x] 3.3 Tapping a provider calls `openExternalMusicLink`; show `Alert` or toast if `opened === false`
  - [x] 3.4 Button should only be visible when song exists (not on a brand-new unsaved song)
  - [x] 3.5 Verify: Tapping a provider logo opens URL; tapping with no link shows alert; logos absent on new song

- [x] 4.0 Add "Open in…" to SongListItem
  - [x] 4.1 Add an "Open in…" action button to the `actionsRow` in `SongListItem`, styled consistently with existing Play/Sing buttons
  - [x] 4.2 Tapping shows same three-provider choice (ActionSheet / Alert) and calls `openExternalMusicLink`
  - [x] 4.3 Show toast if `opened === false`
  - [x] 4.4 Verify: Provider icons removed from list; links working correctly from editor header

- [x] 5.0 Merge and update roadmap
  - [x] 5.1 Run full TypeScript check (`npx tsc --noEmit`)
  - [x] 5.2 Test on iOS simulator: open a song with mock `externalLinks` from both list and editor
  - [x] 5.3 Test on iOS simulator: song with no `externalLinks` — confirm toast and no crash
  - [x] 5.4 Update `docs/tasks/roadmap.md` row: set status to ✅ Complete and Last Updated to today
  - [x] 5.5 Commit, merge `feature/music-deep-linking-mvp` to `main`, delete branch
  - [x] 5.6 Verify: `main` build passes; feature works end-to-end
