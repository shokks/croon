# Croon — Screen UX/UI Spec

**Version:** 3.1  
**Replaces:** v2.0 (combined editor+recording screen)  
**Grounded in:** `docs/croon.md`, `docs/croon-research.md`, `docs/design-principles.md`

---

## 1. Who This App Is For

**The ICP in one sentence:** A voice-insecure amateur who knows exactly what they want to sing, has the words, was using the Snapchat hack, and wants to share a clip with two or three people who already love them.

**What they are not:**
- They are not browsing a catalog looking for a song to try.
- They are not seeking an audience of strangers.
- They are not a producer who wants effects, EQ, or multi-track.

**The 89-comment thread signal:** The "I hate my voice" thread on r/Songwriting is not a problem to be solved in the UI. It is the emotional weather the entire app operates in. Every screen decision is made in awareness that this user is about to be vulnerable.

---

## 2. The Core Emotional Problem

From the research:

> "Customers are not buying recording. They are buying the feeling of being a real singer."

Croon's specific bet (different from Smule's):
> Sharing with people who already accept you removes the need for transformation effects. You don't need reverb to feel safe when your audience is a group chat of three.

**Implication for UX:**
- Do not rush them toward sharing. The share moment should arrive calmly.
- Do not measure or score them. No pitch accuracy, no stars, no "great take!"
- Do make re-recording effortless. They will take 5–10 takes before they're willing to share.
- The waveform on post-recording is not decoration — it is the "you captured something real" signal for someone who doubts their own voice.

---

## 3. Primary User Journey (The Snapchat Hack Replacement)

The Snapchat hack flow the ICP is already doing:
1. Open Snapchat
2. Paste lyrics into a message
3. Start screen recording
4. Sing while reading
5. Stop recording → get a video file
6. Share to WhatsApp

**The mental model is linear and simple.** The user has a single goal. They are not in an exploratory state.

Croon's replacement flow:
1. Open app → see their songs (or empty state if new)
2. Tap song (or tap + to create one)
3. Paste / type lyrics → tap "Record →"
4. Set scroll speed → tap record button
5. Sing while lyrics scroll
6. Stop → hear it back → decide: re-record or share
7. Tap share → send to a group chat

**Why this flow, not alternatives:**

| Alternative | Why rejected |
|---|---|
| Home = recording screen | Doesn't serve returning users. Library is the long-term value: "songs you've timed and saved, retrievable instantly." |
| Home = new song creation (skip library) | Same reason. Works for day 1, breaks at song #3. |
| Combined editor + recording on one screen | Writing/editing lyrics is a different emotional mode from performing. Mixing them on one screen blurs purpose and creates noise. Speed controls belong to the recording ritual, not the writing ritual. |

---

## 4. The Take Loop (Most Important UX Pattern)

The voice-insecure ICP will not share their first take. Or their second. The average session likely involves 3–8 takes before they're willing to share.

**This loop is the core behavioral pattern:**

```
[Pre-Record] → [Recording] → [Post-Recording] → Re-record → [Pre-Record] → ...
```

**The take loop must feel like a breath, not a journey.** Tapping "Re-record" returns the user to the Pre-Record state (speed chips + idle record button) in under 1 second.

Specifically:
- Post-recording → Re-record → Pre-Record state. Lyrics reset to top. Speed chips visible. Record button idle and ready to tap.
- Do NOT navigate back to Song Setup — they are not editing lyrics between takes.
- Do NOT ask "are you sure?" — re-recording is the expected action, not a destructive one.
- The speed setting persists across takes in the same session.

---

## 5. Screen Map

### Current Route Files (Expo Router)

- `/` → `app/index.tsx`
- `/modal` → `app/modal.tsx`
- `/song/[id]` → `app/song/[id].tsx`
- `/song/new` → `app/song/new.tsx`
- `/song/search` → `app/song/search.tsx`
- `/song/record/[id]` → `app/song/record/[id].tsx`
- Shared layout/navigation shell → `app/_layout.tsx`

```
┌──────────────┐     ┌─────────────────┐
│   Library    │────▶│   Song Setup    │
│  (Home)      │     │  (Lyrics only)  │
└──────────────┘     └────────┬────────┘
        ▲                     │ tap "Record →"
        │ back                ▼
        │            ┌─────────────────┐
        │            │   Pre-Record    │◀──────────────┐
        │            │ (Speed + Start) │               │
        │            └────────┬────────┘               │
        │                     │ tap record button       │
        │                     ▼                        │
        │            ┌─────────────────┐               │
        │            │   Recording     │               │ Re-record
        │            │ (Teleprompter)  │               │ (no nav)
        │            └────────┬────────┘               │
        │                     │ stop                   │
        │                     ▼                        │
        │            ┌─────────────────┐               │
        └────────────│ Post-Recording  │───────────────┘
          save+share │   (Review)      │
                     └─────────────────┘
```

**Key flows:**
- Song Setup ← → Library (back/forward, auto-save, no confirmation)
- Song Setup → Pre-Record (one-way push, "Record →" button)
- Pre-Record → Recording (in-place state change, no navigation)
- Recording → Post-Recording (in-place state change, no navigation)
- Post-Recording → Pre-Record (Re-record, in-place, no navigation)
- Post-Recording → Library (Done exits the session; Share keeps user in review)

---

## 6. Screen Specifications

### A. Library (Home)

**Purpose:** Give returning users instant access to their saved songs. Give new users a welcoming path to their first recording.

**Layout**
- Full `#0E0C0A` background — no surface chrome at the list level.
- Header: "Croon" title. No navigation buttons in the header.
- Song list with 20dp horizontal padding.
- **Floating `+` button** — bottom-right, 56dp circle, `#D4A853` amber. Fixed position, safe-area aware. This is the only primary action on this screen.

**Song list item (min height 64dp)**
- Song name: DM Sans SemiBold 16sp, `#F2EDE6`
- First lyric line (preview): DM Sans 13sp, `#8A8070` — truncated to ~60 chars
- Date created: DM Sans 12sp, `#4A4540`
- Hairline divider: `#2E2A24`
- Delete action: trailing trash icon in `#4A4540` — quiet, not alarming

**Empty state (first-time user)**
- Centered, generous whitespace.
- Two lines of copy in `#8A8070`, 16sp: "No songs yet." / "Tap + to record your first."
- No icons, no illustrations, no feature tours. Just the words and the + button below.
- This IS the onboarding. There is no other onboarding.

**UX Behavior**
- Tap row → Song Setup (editor loaded with existing song data).
- Tap `+` → Song Setup (blank, ready to paste lyrics).
- First-load staggered fade-in: 50ms delay per item, max 250ms total. Only on initial mount, not on every focus.
- No loading state visible — local data loads fast enough.

---

### B. Song Setup (Lyrics Editor)

**Purpose:** One job — get the lyrics right. Nothing else competes for attention on this screen.

**Layout**
- Full `#0E0C0A` background.
- Header: back arrow (left) + song name as title. No other header controls.
- Song name: TextInput, DM Sans SemiBold 18sp, `#F2EDE6`. Top of screen, above a hairline divider (`#2E2A24`).
- Lyrics area: fills all available space between name and the CTA. Two visual states based on keyboard:
  - **Keyboard visible (editing):** DM Sans 16sp TextInput, `#F2EDE6`. Practical, comfortable for typing. "Done" button (amber, `#D4A853`) appears above the keyboard to dismiss it.
  - **Keyboard dismissed (preview):** Lora 22sp read-only scroll view, `#F2EDE6`. Shows how the lyrics will look during recording. Tapping re-opens keyboard.
- **"Record →" button**: full-width, bottom of screen, safe-area aware. `#1A1714` surface background, `#D4A853` amber text and chevron. DM Sans SemiBold 16sp. This is the only exit from this screen (other than back).

**UX Behavior**
- Back arrow → Library. No confirmation dialog. Songs auto-save on every change (400ms debounce) and on screen blur.
- "Record →" → navigates to Pre-Record screen. Saves before navigating.
- "Record →" is disabled (visually dimmed) if lyrics field is empty — there's nothing to scroll.
- Keyboard "Done" → dismisses keyboard, shows Lora preview.
- Song name in the header title updates as the user types.

**What this screen does NOT have:**
- Speed controls (belong to recording ritual, not writing ritual)
- Record button (belongs on the recording screen)
- Save button (auto-save handles it)

---

### C. Pre-Record + Recording (two in-place states, one screen)

This is a single navigated screen with two in-place visual states. No navigation between them — just a state change when the user taps the record button.

#### C1. Pre-Record state (idle, before tapping record)

**Purpose:** Let the user configure scroll speed and commit to starting a take. A brief ritual before the performance.

**Layout**
- Full `#0E0C0A`. No chrome.
- Header: back arrow (returns to Song Setup). No title — they know what song this is.
- Lyrics: Lora 22sp, `#8A8070` (secondary — they're not singing yet, this is preview). Scrollable, non-interactive.
- Bottom area:
  - **Speed chips** — Slow / Med / Fast, 36dp height, centered horizontally above the record button.
    - Inactive: `#242019` background, `#8A8070` text
    - Active: `#3D2E10` background, `#D4A853` text
  - **Record button** — 72dp, `#C0392B`, mic icon, bottom center, safe-area aware.

**UX Behavior**
- Speed selection persists per song (auto-saved).
- Back arrow → Song Setup.
- Tapping record → transitions in-place to Recording state (C2). No screen navigation.

#### C2. Recording state (active take)

**Purpose:** Disappear. Let the user sing.

**Layout**
- Full `#0E0C0A`. The screen is a window, not a document.
- **No back button, no header** — anything tappable while singing is a hazard.
- Lyrics: Lora 22–26sp, left-aligned block, horizontally centered, line-height 1.7.
  - **Current line** (closest to center): `#F2EDE6`
  - Lines above: fade toward `#8A8070`. Top gradient mask suggests they have passed.
  - Lines below: `#8A8070`
- Elapsed timer: DM Sans 13sp, `#8A8070`, bottom-left. `tabular-nums`. No label.
- **Audio activity indicator**: 2dp amplitude bar just above record button, amber `#D4A853` at 30% opacity. Visible only while recording. Its sole job: confirm the mic is on.
- **Record button**: 80dp, `#E74C3C`, stop icon, slow 2s pulse ring. Bottom center.

**UX Behavior**
- Lyrics auto-scroll at saved speed. Timer counts up. Activity bar breathes.
- Tapping stop → in-place transition to Post-Recording (fade 200ms). No navigation.
- Pause: small `⏸` badge, top-right, amber, semi-transparent. Tapping resumes. No modal.

---

### D. Post-Recording (Review)

**Purpose:** Let the user hear what they did, calmly, without pressure.

**Layout (top to bottom)**
1. **Top utility row**:
   - Left: **Song name** (DM Sans SemiBold, `#F2EDE6`) for quiet context.
   - Right: **Done** text button (DM Sans SemiBold 16sp, `#D4A853`), safe-area aware, with a comfortable hit area.
   - Done is an exit affordance, not a celebratory action.
2. **Waveform**: full width, ~64dp height. A horizontal waveform in `#D4A853` at 40% opacity — soft amber amplitude, not a garish block. This is the "you captured something real" signal. It is not optional. It should appear immediately when this screen loads.
3. **Duration**: DM Sans 13sp, `#8A8070`. e.g. "0:42". Below the waveform, left-aligned.
4. **Action row** (equal visual weight, no hierarchy):
   - **Play** — 72dp circle button, `#1A1714` background, triangle icon in `#F2EDE6`. When playing: square icon (stop).
   - **Re-record** — text button, `#8A8070`, 16sp. Tapping immediately starts the take loop — no confirmation, no navigation.
   - **Share** — text button, `#8A8070`, 16sp. Opens native share sheet.

**Action hierarchy by ICP behavior:**
- **Re-record** will be tapped most often. It is visually secondary but physically easy to reach.
- **Share** is the terminal goal. It is equally weighted with Re-record to avoid pressure.
- **Play** is the first instinct. It is the primary button.

**Re-record behavior (the take loop):**
- Tapping "Re-record" → fades out post-recording screen (200ms) → fades in Recording screen, lyrics at beginning, record button idle, ready to tap.
- Zero intermediate screens. Zero confirmations.
- The previous take is discarded silently. No "your recording will be lost" prompt. This is expected behavior for a repeat-take workflow.

**UX Behavior**
- No confetti, no score, no "Great take!" message.
- Waveform is static until Play is tapped. During playback, a thin vertical playhead line sweeps across the waveform from left to right.
- Share opens the native OS share sheet. The first-surface options will be whatever the user's OS surfaces (WhatsApp, iMessage, AirDrop — the close-friends channels). Croon does not reorder this.
- Done exits to Library immediately, without confirmation, and stops any active playback.

---

## 7. Motion & Transitions

| Moment | Behavior |
|---|---|
| Screen transitions | Fade 200ms. Not slide — fading feels like the scene changing, sliding feels like navigation. |
| Library item entrance | Staggered opacity fade-in: 50ms per item, max 250ms total. First mount only. |
| Keyboard dismiss (song setup) | Lyrics crossfade from DM-Sans edit input to Lora preview, 200ms opacity. |
| Song Setup → Pre-Record | Stack push (standard nav transition). |
| Pre-Record → Recording (start) | In-place: speed chips fade out, lyrics brighten, record button pulses. 200ms. |
| Recording → Post-Recording (stop) | In-place fade 200ms. |
| Post-Recording → Pre-Record (re-record) | In-place fade out/in. 200ms each. No stack transition. |
| Record button — idle → recording | 200ms scale + color ease. Not a snap — a breath. |
| Record button — recording pulse | 2s Animated loop. Slow, like a heartbeat. The only persistent animation in the app. |
| Lyrics scroll | easeInOut, 0.5s slow start. The first half-second is intentionally gentle — don't ambush the user. |

**Avoid:**
- Bounce physics on any element.
- Slide-in modals.
- Loading spinners for local data.
- Any animation not in this list.

---

## 8. Global UI Rules

**Colors** (from `docs/design-principles.md`):
```
Background:     #0E0C0A
Surface:        #1A1714
Surface raised: #242019
Border:         #2E2A24
Text primary:   #F2EDE6
Text secondary: #8A8070
Text disabled:  #4A4540
Accent:         #D4A853
Accent muted:   #3D2E10
Record red:     #C0392B
Record active:  #E74C3C
```

**Typography:**
- Lyrics: Lora, 22–26sp, weight 400, line-height 1.7
- UI headings: DM Sans SemiBold, 16–20sp
- UI body/labels: DM Sans Regular, 13–16sp
- UI captions: DM Sans Regular, 12sp, `#8A8070`

**Touch targets:**
- List rows: min 64dp
- Record/play button: 72–80dp diameter
- FAB: 56dp
- Speed chips: 36dp height

**Spacing scale (only these values):**
4 / 8 / 12 / 16 / 20 / 24 / 32 / 48dp

---

## 9. What This App Must Never Feel Like

- **A karaoke bar** — neon, loud, public stage energy.
- **A social network** — avatars, feeds, follower counts, stranger interactions.
- **A DAW** — meters, EQ sliders, multi-track panels.
- **A generic productivity app** — white background, blue primary buttons, system font.
- **A product that's celebrating** — no confetti, no success animations, no "You did it!" banners.
- **An app that's rushing you to share** — the share button is equal weight to re-record, not larger. Not first.

**The single test:** Show a screenshot to someone who doesn't know what the app does. They should feel: *this looks like something someone made carefully for someone who wants to sing alone.* Not: *this looks like every other music app.*
