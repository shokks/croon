# Croon — Design Principles

**Created:** 2026-03-13  
**Applies to:** Expo app (iOS + Android)

---

## The Emotional Context

Before any design decision: understand who is holding this phone and what they are feeling.

The user is alone. They are about to record their voice — probably for the first time in a long time, or ever. The research is unambiguous: 89 comments on "I hate my voice." Smule's premium features exist entirely to make people feel less embarrassed about playback. This app asks users to be vulnerable.

Croon's design must answer that vulnerability with **calm, warmth, and focus** — not excitement, not spectacle. The app should feel like a private room, not a stage. Every pixel should say: *this is for you, no one is watching, you are safe here.*

---

## Design Identity: The Late-Night Studio

The reference image: a songwriter at a desk at 11pm. Warm lamp light. A notebook. A microphone. No audience.

Not: a karaoke bar. Not: a social feed. Not: a professional DAW.

The app should feel like a tool a serious-but-private person would be proud to own — the kind of thing that looks considered and intentional, not assembled from a component kit.

---

## 1. Color

**Implemented palette** (source of truth: `constants/theme.ts` → `Palette`):

```
Background:       #0C0C0E
Surface:          #161618
Surface raised:   #222224
Border:           #2C2C30

Text primary:     #F2F2F0
Text secondary:   #8A8A90
Text disabled:    #484850

Accent:           #9B8EC4
Accent muted:     #1E1828

Record red:       #C0392B
Record active:    #E74C3C
```

**Why each choice:**

- **`#0C0C0E` background** — Near-black with the lightest cool undertone. Avoids the harshness of pure `#000000` (which creates eye-straining contrast on OLED) while keeping the screen dark enough for low-light use — the primary context for rehearsing lyrics before sleep or in a bedroom.

- **`#161618` / `#222224` surfaces** — Two steps of elevation in neutral-dark. Subtle enough that cards don't feel like boxes, but enough contrast to separate sections without borders. The cool undertone unifies all surfaces so the eye reads them as one environment, not a stack of panels.

- **`#2C2C30` border** — Just visible enough to divide without drawing attention. Deliberately dim — borders should never compete with text.

- **`#F2F2F0` text primary** — Warm off-white, not pure white. Pure white on near-black is clinically bright. `#F2F2F0` reads as softer, like paper in lamplight — appropriate for a screen the user stares at for several minutes while singing.

- **`#8A8A90` text secondary / `#484850` text disabled** — Stepped grey scale matching the background's cool undertone. Secondary text guides without distracting. Disabled text is intentionally barely visible — it signals "not your focus right now" without disappearing entirely.

- **`#9B8EC4` accent (muted lavender-purple)** — This is the most deliberate choice. The accent needed to be:
  - Clearly interactive (readable against all dark surfaces)
  - Not energetic or excited (rules out orange, yellow, bright green, electric blue)
  - Not generic productivity (rules out blue)
  - Not karaoke-app (rules out hot pink, electric purple, neon anything)
  
  Desaturated lavender sits at the intersection of "musical" and "calm." It has enough personality to feel intentional without shouting. On dark backgrounds it reads as a lit candle in the distance — present, not glaring.

- **`#1E1828` accent muted** — The accent at ~15% opacity, used for chip/badge backgrounds. Provides a subtle tinted surface without adding visual weight.

- **`#C0392B` / `#E74C3C` record red** — The record button is the one element that is allowed to demand attention. Deep red is universal for "recording" — no explanation needed. Two values: idle (deep, confident) and active (slightly brighter, used for the pulsing ring animation).

**What to avoid:**
- Pure black or white — too harsh for a screen users stare at while vulnerable
- Bright saturated purple — reads as "AI product" or "Smule clone"
- Warm amber/gold — the original design brief called for this, but in practice the neutral-cool palette creates a more focused, less "cozy-app" feel that better suits the recording context
- Any colour that reads as energetic, social, or celebratory

---

## 2. Typography

Typography is the most important design decision in this app. The lyrics are the entire product — they must be beautiful to read.

**Lyrics display font: A humanist serif.**

The lyrics should feel handwritten-adjacent — personal, warm, slightly imperfect. Not a screen font. Think of how a poem looks in a printed book.

Recommended: **`Lora`** (Google Fonts, available via `expo-google-fonts`) — a contemporary serif designed specifically for body reading. It has warmth without feeling old-fashioned.

Alternative: **`Playfair Display`** for a more editorial, literary feel.

```
Lyrics text:      Lora, 22–26sp, Regular (400)
Lyrics line-height: 1.7 (generous — user is reading while singing)
```

**UI font: A geometric sans with personality.**

Not Inter. Not Roboto. Not SF Pro (system default).

Recommended: **`DM Sans`** — optical size-aware, warm, slightly quirky. Feels hand-crafted without being precious.

```
Headings:         DM Sans, 18–24sp, SemiBold (600)
Body / labels:    DM Sans, 14–16sp, Regular (400)
Captions:         DM Sans, 12sp, Regular, text-secondary color
```

**What to avoid:**
- System font stack as the only choice
- All-caps labels everywhere (cold, corporate)
- Mixing more than 2 typefaces

---

## 3. The Record Button

The record button is the emotional center of the app. It deserves special treatment.

- **Size:** Minimum 72dp diameter. Large enough to tap confidently without looking.
- **Idle state:** Deep red (`#C0392B`), solid circle, mic icon in warm white. No border, no shadow — just the circle.
- **Recording state:** Slightly expanded (80dp), pulsing ring animation in `#E74C3C` — slow, 2s breathing pulse. The icon changes to a stop square. The pulse should feel like a heartbeat, not an alert.
- **Transition:** 200ms scale + color ease. Not a snap — a breath.
- **Placement:** Fixed at bottom center, always visible, never obscured by the keyboard or safe area.

The pulse animation is the only persistent animation in the app. Everything else is either static or triggered. This makes the pulse feel significant — *something is happening, you are being heard.*

---

## 4. The Lyrics Screen (Teleprompter Mode)

This is the screen the user stares at while singing. It needs to disappear.

- **Background:** Full `#0E0C0A` — no cards, no panels, no chrome. The screen is a window, not a document.
- **Lyrics:** Centered horizontally, left-aligned text block (not fully justified — too rigid). Large, generous line-height.
- **Current line:** Subtle highlight — the line closest to center gets `text-primary` (`#F2EDE6`) while lines above fade toward `text-secondary` (`#8A8070`). Soft gradient mask at top (fade to background) to suggest lines have passed.
- **No visible UI chrome during recording.** The record button and a minimal timer are the only controls. Everything else hides.
- **Paused indicator:** When the user taps to pause, a single small badge appears — `⏸` in `accent` color, top-right corner, semi-transparent. It disappears on resume. No modal, no full-screen overlay.

---

## 5. Motion & Animation

Less is more. The user is in a focused, slightly anxious state. Unexpected animations are disruptive.

**Principles:**
- One signature animation: the record button pulse. Everything else is functional.
- Screen transitions: fade (200ms), not slide. Sliding feels like navigation; fading feels like the scene changing.
- Lyrics scroll: `Animated.timing` with `easeInOut` — starts gently, not abruptly. The first 0.5s should be noticeably slow so the user doesn't feel ambushed.
- Library list: staggered fade-in on mount (50ms per item, max 300ms total). Only on first load, not on every re-render.

**What to avoid:**
- Bounce physics on anything (too playful for the context)
- Slide-in modals (disorienting mid-song)
- Loading spinners for local data — it's all on device, just show it

---

## 6. Layout & Spacing

The app has two primary screens. Each has a single job. Design accordingly.

**Library screen:**

The library is a personal, private workspace — not a feed. The design reflects that: no social signals, no discovery noise, just the user's songs and a fast path back into them.

*Hero card:*
- Full-width card (16dp horizontal margin), 200dp tall, border-radius 18
- Always shows the most recently recorded song (falls back to most recently created if no recordings exist)
- Artwork fills the card as background; a dark scrim (`rgba(0,0,0,0.38)`) over the bottom third makes text legible without obscuring the image
- Eyebrow: `DM Sans SemiBold`, 11sp, uppercase, letter-spacing 0.8 — "Last Recorded" or "Recently Added"
- Title: `DM Sans SemiBold`, 22sp
- Inline CTA pill (accent background, dark text): "Sing again" or "Start recording" — this is the primary tap target on the screen, designed to get the user back into flow in one tap
- When no artwork is present: `surface` background (`#161618`) — the card stays, the texture changes. Never show a broken image placeholder at hero scale.

*Section header + filter chips:*
- "Your Library" label (`DM Sans SemiBold`, 17sp) + song count in `text-disabled` — tells the user they're in a personal space, not a catalog
- Three filter chips below: **All / Recorded / Drafts** — border-only in inactive state (`border` color), accent-tinted background + accent border + accent text in active state. These chips are the only navigation within the library — keep them.

*Song cards:*
- Each song is a card, not a list row. Card background: `surface-raised` at ~62% opacity with `border` at ~65% opacity and `border-radius: 16`. Subtle shadow (`0, 4, 12, 0.14`). This creates a sense of depth — the library feels like a collection of objects, not a spreadsheet.
- Card has two zones:
  1. **Top row (pressable):** Artwork thumbnail (56dp, `border-radius: 12`) + title + lyrics preview line + metadata row. Tapping opens review (if recorded) or editor. Press state: `opacity 0.8` — calm feedback, not a bounce.
  2. **Action bar (always visible, not pressable as a unit):** Separated from the top row by a hairline divider (`border` color at 50%). Contains: **Sing** (accent pill with mic icon — primary action), **Play** (conditional, only if recording exists), **Edit**, and a right-aligned **Delete** (trash icon, `text-disabled`). Each action is its own `Pressable` with comfortable padding.
- Scroll speed badge in the metadata row, right-aligned: small rounded pill (`border-radius: 6`), `border` background, `text-disabled` text, 11sp, capitalized. Shows "Slow", "Medium", or "Fast". This is useful information for the user who has tuned a song — they can see it without opening the song.
- Recorded indicator: 5dp accent dot, bottom-right corner of artwork thumbnail.
- 10dp vertical margin between cards. No separator lines between cards — the cards themselves create the visual separation.

*FAB:*
- Fixed bottom-right, 56dp diameter, `accent` background, white `+` icon. Not top-right header — the library can grow long and a bottom FAB is always in thumb reach.
- Shadow uses `accent` as shadow color (not black) — a subtle glow that grounds the button.

**Song screen:**
- Name input: small, top of screen, `text-secondary` placeholder ("Song name...")
- Lyrics input: fills all available space between name and controls
- Speed control: horizontal row of 3 buttons (Slow / Med / Fast) above the record button — compact, 36dp height, inactive state uses `surface-raised`, active uses `accent-muted` with `accent` text
- Bottom safe area: always respected — record button never overlaps home indicator

**Spacing scale:** 4 / 8 / 12 / 16 / 20 / 24 / 32 / 48dp. Don't invent custom values.

---

## 7. Post-Recording Screen

The user just sang something. They are listening back, probably feeling exposed. The design should be calm and affirming — not immediately pushing them to share.

- Show three options with equal visual weight: **Play**, **Share**, **Re-record**
- No success confetti, no celebration animation. Let the music speak.
- Play button: circular, same size as the record button. Icon-only — a triangle. When playing, becomes a square (stop).
- Share and Re-record: text buttons below, `text-secondary` color until tapped.
- The recording waveform or duration can appear as a quiet detail above the buttons — optional, but grounding.

---

## 8. What This App Should Never Look Like

- A karaoke app with neon stage lighting
- A social feed with avatars, likes, and stranger-facing profiles
- A DAW with sliders, knobs, and meters
- A generic productivity app with white backgrounds and blue primary buttons
- A startup landing page dropped into mobile

Cards are fine — the library uses them deliberately. What to avoid is cards that feel *public* or *social*: visible play counts, follower counts, share prompts on every surface, anything that implies an audience. Every card in this app represents something the user made for themselves.

If a screenshot of this app looks like it could belong to Smule, StarMaker, or any generic music app — it's wrong.

---

## Reference Mood

**Apps to study** (for craft, not to copy):
- **Notchmeup / Darkroom** — how a private tool should feel: focused, dark, no social noise
- **Bear (notes app)** — warm typography, serif body text, personal without being cute
- **Transcript / Whisper apps** — how text-on-dark can feel readable and calm

**The single test:** Show a screenshot to someone who doesn't know what the app does. They should feel: *this looks like something someone made carefully.* Not: *this looks like every other app.*
