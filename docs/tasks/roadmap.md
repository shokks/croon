# SongBuddy — Task Roadmap

| Feature | Type | Spec | PRD | Tasks | Status | Owner | Last Updated | Notes |
|---------|------|------|-----|-------|--------|-------|--------------|-------|
| MVP (song library, editor, recording, post-recording) | Feature | [songbuddy.md](../songbuddy.md) | [prd-songbuddy-mvp.md](./prd-songbuddy-mvp.md) | [tasks-songbuddy-mvp.md](./tasks-songbuddy-mvp.md) | ✅ Complete | — | 2026-03-13 | All 7 task groups merged to main |
| Song Search + Auto-Lyrics | Feature | — | [prd-song-search-lyrics.md](./prd-song-search-lyrics.md) | [tasks-song-search-lyrics.md](./tasks-song-search-lyrics.md) | ✅ Complete | — | 2026-03-13 | iTunes + LRCLIB + synced highlight + artwork. Verified on iOS + Android. |
| Library page redesign | 🎨 Polish | — | — | — | ✅ Complete | — | 2026-03-14 | Hero card (square artwork, last-recorded logic), filter chips (All/Recorded/Drafts), elevated cards, speed badge, simplified action row (Sing + Play only) |
| Song editor redesign | 🎨 Polish | — | — | — | ✅ Complete | — | 2026-03-14 | Name + artist fields, speed chips (Ballad/Normal/Uptempo), mini-player card, contextual record button label, delete in nav header |
| Post-recording view redesign | 🎨 Polish | — | — | — | ✅ Complete | — | 2026-03-14 | Waveform inside elevated card, integrated play button, action buttons match card language |
| Artist / song name split | ✨ Feature | — | — | — | ✅ Complete | — | 2026-03-14 | `Song.artist` field added; search prefills title + artist separately; artist shown in library card, editor, and post-recording header |
| Library UX simplification | 🔧 Found in use | — | — | — | ✅ Complete | — | 2026-03-14 | Removed Edit + Delete from card; delete moved to song editor nav header with confirmation alert |
| Last-recorded hero not updating | 🐛 Found in use | — | — | — | ✅ Complete | — | 2026-03-14 | Hero was sorting by createdAt, not recording.recordedAt — fixed with reduce |
| Mini-player not playing in editor | 🐛 Found in use | — | — | — | ✅ Complete | — | 2026-03-14 | Card was View not Pressable; handler made async with proper await/try-catch |
| Recorded filter empty state wrong copy | 🐛 Found in use | — | — | — | ✅ Complete | — | 2026-03-14 | Copy now adapts per active filter |
| Design principles update | 📝 Docs | — | — | — | ✅ Complete | — | 2026-03-14 | Section 6 rewritten to document card system, hero card, filter chips, action bar; Section 8 clarified card intent |
| Music Deep Linking (Spotify / Apple Music / YouTube) | ✨ Feature | [spec](../spec/spec-music-deep-linking-mvp.md) | [prd-music-deep-linking-mvp.md](./prd-music-deep-linking-mvp.md) | [tasks-music-deep-linking-mvp.md](./tasks-music-deep-linking-mvp.md) | ✅ Complete | Saikat | 2026-03-14 | Icon-only provider buttons; moved from editor header to inline row; only available providers shown; Spotify native URI on Android with web URL fallback; platform-aware (skips custom URI on web); fixed URL encoding |
| Share Video Export | ✨ Feature | [spec](../spec/spec-songbuddy-share-video-mvp.md) | [prd-songbuddy-share-video-mvp.md](./prd-songbuddy-share-video-mvp.md) | — | 🔲 Not Started | — | 2026-03-15 | Server-side FFmpeg via Cloudflare (Worker API + Queue + R2 + separate processor); 1080x1920 MP4; blurred album art + lyrics + title overlay; 3 themes; entry from post-recording + song detail |
