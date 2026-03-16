# Spec: Music Deep Linking from User Songs (MVP)

## Goal
Allow users to open a song from Croon directly in Spotify, Apple Music, or YouTube using deep links, without in-app playback control or OAuth login.

## Scope (MVP)
- Add deep-link actions on song surfaces (song details and song list item actions).
- Support three destinations:
  - Spotify
  - Apple Music
  - YouTube
- Resolve destination URLs from existing song metadata.
- If app-specific deep link cannot be opened, fall back to web URL.

## Out of Scope (explicit)
- In-app playback control (play/pause/seek/state sync).
- Spotify/Apple OAuth or token management.
- Background playback managed by Croon.
- Hard real-time lyrics sync with external player state.

## User Experience
1. User opens a song in Croon.
2. User taps “Open in…” and selects Spotify, Apple Music, or YouTube.
3. App attempts to open native app deep link.
4. If unavailable, app opens web URL.
5. If no link available for selected provider, show lightweight error/toast.

## Data Model
Add provider link fields to song metadata (persisted in local storage schema):

```ts
type ExternalSongLinks = {
  spotify?: {
    uri?: string; // spotify:track:...
    url?: string; // https://open.spotify.com/track/...
  };
  appleMusic?: {
    url?: string; // https://music.apple.com/...
  };
  youtube?: {
    url?: string; // https://youtu.be/... or youtube watch url
  };
};
```

Song should store these links where song metadata is currently persisted. Keep fields optional for backward compatibility.

## Link Resolution Strategy
Priority by provider:

- Spotify:
  1. `spotify.uri` (native)
  2. `spotify.url` (web fallback)
- Apple Music:
  1. `appleMusic.url` (open directly; iOS can route to app)
- YouTube:
  1. Convert/watch or youtu.be URL to app-openable URL when possible
  2. Fallback to original `youtube.url`

If no provider link exists, show “Link not available for this song.”

## UI Changes
- Song detail screen:
  - Add “Open in” button/menu with 3 provider options.
- Song list item (quick actions):
  - Add optional action sheet entry: “Open in…”.
- Keep interactions minimal and non-blocking.

## Implementation Plan
1. Extend song type definitions to include `externalLinks`.
2. Update storage migration/normalization to safely handle missing fields.
3. Add link-opening helper in `lib/`:
   - Input: provider + song
   - Behavior: resolve deep link/fallback URL and open via React Native Linking.
4. Wire UI actions in song detail and list item surfaces.
5. Add simple user-facing error handling for missing/invalid links.

## Validation Rules
- Selecting a provider with valid link opens destination app/web successfully.
- Missing links show clear non-crashing feedback.
- Existing songs without `externalLinks` continue to render and function.
- No regression to current song creation/edit/search flows.

## Edge Cases (MVP-level)
- Provider app not installed: web fallback should still open.
- Malformed stored URL: show error feedback, do not crash.
- Offline mode: opening may fail; show generic open failure message.

## Telemetry (Optional, lightweight)
- Track event: `song_open_external` with `{ provider, success }`.
- Skip if analytics infra is not already in place.

## Acceptance Criteria
- Users can open any song with available provider links in Spotify, Apple Music, or YouTube.
- App gracefully handles unavailable/malformed links.
- No OAuth/auth implementation is introduced.
- Feature is implemented as a fast MVP with minimal added complexity.
