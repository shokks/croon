# Croon

A simple, private app for recording yourself singing. Paste your lyrics, hit record, get a clip.

## What it is

Croon is a mobile-first singing app built for people who want to record themselves without the noise of social networks. No duets with strangers. No paywalled solo recording. No algorithmic feeds. Just you, your lyrics, and a clip you can share with people who already love you.

The app was born from a simple observation: people were hacking together a broken solution using Snapchat, screen recording, and Spotify to record themselves singing. Croon makes that actually work.

## Features

- **Your own lyrics** — Paste, type, or search for songs and import lyrics automatically
- **Auto-scrolling teleprompter** — Lyrics scroll at a speed you set (Ballad / Normal / Uptempo)
- **One-tap recording** — Record audio with your device mic; lyrics stay visible while you sing
- **Instant playback** — Review your take immediately with a waveform visualization
- **Easy sharing** — Export and share to WhatsApp, iMessage, TikTok, or anywhere
- **Personal song library** — Save songs with timing settings for quick re-access
- **Music deep linking** — Jump to the original song on Spotify, Apple Music, or YouTube
- **Fully local** — No account required. Your recordings stay on your device

## Design Philosophy

Croon is designed for the voice-insecure amateur. The person who wants to sing alone at 11pm, not perform on a stage. Every design decision flows from this:

- **Calm, not energetic** — Dark, muted palette (lavender accent on near-black backgrounds)
- **Private, not social** — No public profiles, no likes, no strangers
- **Focused, not cluttered** — One job per screen. No EQ sliders, no pitch scores, no distractions
- **Warm typography** — Humanist serif (Lora) for lyrics, geometric sans (DM Sans) for UI

The emotional context matters: the user is about to be vulnerable. The app should feel like a private room, not a stage.

## Tech Stack

- **React Native** with **Expo** (iOS + Android)
- **TypeScript**
- **Expo Router** for file-based navigation
- **Expo Audio** for recording
- **LRCLIB** + **iTunes API** for lyrics and artwork lookup

## Running locally

```bash
# Install dependencies
npm install

# Start the development server
npm start
```

Then scan the QR code with the Expo Go app, or run on iOS/Android simulators.

## Project Structure

```
app/                 # Expo Router screens
  index.tsx          # Library (home screen)
  song/
    [id].tsx         # Song editor
    new.tsx          # Create new song
    search.tsx       # Search songs + auto-import lyrics
    record/[id].tsx  # Recording screen with teleprompter
components/          # React components
  SongListItem.tsx
  LyricsEditor.tsx
  RecordingScreen.tsx
  ...
lib/                 # Hooks and utilities
  useSongSearch.ts   # Search iTunes + LRCLIB
  useLyricsLookup.ts # Fetch synced lyrics
  ...
constants/
  theme.ts           # Colors, typography tokens
docs/                # Specs, PRDs, research
```

## Why this exists

The incumbents (Smule, StarMaker) are social platforms built around licensed catalogs. They structurally cannot support custom lyrics — their entire model assumes you want their songs. Croon inverts this: you bring the lyrics, we provide the tool.

This creates a different kind of product:

- No chicken-and-egg problem — useful with one user on day one
- No catalog licensing battles
- No social graph to bootstrap
- No algorithm to game

The bet is that sharing with close friends removes the need for transformation effects (reverb, pitch correction). You don't need to sound like a "real singer" when your audience already accepts you.

## Roadmap

See `docs/tasks/roadmap.md` for the full feature roadmap and task breakdown.

## Name

**Croon** — to sing or hum in a soft, low voice. The name reflects the app's purpose: quiet, personal, intimate.

---

Built by [88mph](https://88mph.co)
