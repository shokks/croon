# LyricLoop — Design Principles

**Created:** 2026-03-13  
**Applies to:** Expo app (iOS + Android)

---

## The Emotional Context

Before any design decision: understand who is holding this phone and what they are feeling.

The user is alone. They are about to record their voice — probably for the first time in a long time, or ever. The research is unambiguous: 89 comments on "I hate my voice." Smule's premium features exist entirely to make people feel less embarrassed about playback. This app asks users to be vulnerable.

LyricLoop's design must answer that vulnerability with **calm, warmth, and focus** — not excitement, not spectacle. The app should feel like a private room, not a stage. Every pixel should say: *this is for you, no one is watching, you are safe here.*

---

## Design Identity: The Late-Night Studio

The reference image: a songwriter at a desk at 11pm. Warm lamp light. A notebook. A microphone. No audience.

Not: a karaoke bar. Not: a social feed. Not: a professional DAW.

The app should feel like a tool a serious-but-private person would be proud to own — the kind of thing that looks considered and intentional, not assembled from a component kit.

---

## 1. Color

**Base palette: Dark and warm, never clinical.**

Avoid pure black (`#000000`) and pure white. They feel cold and harsh — wrong for vulnerability.

```
Background:       #0E0C0A  (warm near-black, like a darkened recording booth)
Surface:          #1A1714  (card/sheet backgrounds)
Surface raised:   #242019  (elevated elements, modals)
Border:           #2E2A24  (subtle dividers)

Text primary:     #F2EDE6  (warm off-white, like aged paper)
Text secondary:   #8A8070  (muted warm grey)
Text disabled:    #4A4540  

Accent:           #D4A853  (warm amber/gold — a lit candle, not a neon sign)
Accent muted:     #3D2E10  (accent tint for backgrounds)

Record red:       #C0392B  (deep, confident red — not bright alert red)
Record active:    #E74C3C  (pulsing state)
```

**What to avoid:**
- Purple gradients (Smule, every AI-generated music app)
- Teal + white (generic productivity)
- Bright neon anything — this is intimate, not a concert
- Light mode as default (lyrics reading in low light is a primary use case)

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
- Generous padding (20dp horizontal)
- Song list items: tall enough to tap without precision (min 56dp height)
- Song name: `DM Sans SemiBold`, 16sp
- Date/metadata: `DM Sans Regular`, 13sp, `text-secondary`
- "+" button: top-right header, accent gold color, large tap target

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
- A social app with gradients, cards, and avatars
- A DAW with sliders, knobs, and meters
- A generic productivity app with white backgrounds and blue primary buttons
- A startup landing page dropped into mobile

If a screenshot of this app looks like it could belong to Smule, StarMaker, or any generic music app — it's wrong.

---

## Reference Mood

**Apps to study** (for craft, not to copy):
- **Notchmeup / Darkroom** — how a private tool should feel: focused, dark, no social noise
- **Bear (notes app)** — warm typography, serif body text, personal without being cute
- **Transcript / Whisper apps** — how text-on-dark can feel readable and calm

**The single test:** Show a screenshot to someone who doesn't know what the app does. They should feel: *this looks like something someone made carefully.* Not: *this looks like every other app.*
