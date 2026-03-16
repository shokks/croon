# Croon — Research Notes

**Captured:** 2026-03-13
**Sources:** Smule landing page, Singa landing page, Karaoke Sync landing page, StarMaker reviews, Smule Trustpilot (111 reviews, 1.6/5), 11 Reddit threads (r/NoStupidQuestions, r/SmuleSing, r/singing, r/Songwriting, r/mac, r/karaoke)

---

## Problem Validation

- **Clear workaround evidence**: Reddit r/NoStupidQuestions post titled "How do I record myself singing on my phone via screen recording, while also reading the lyrics on the screen?" describes users pasting lyrics into Snapchat chat and screen-recording to sing along. This is exactly the pain Croon solves.
- **Smule/StarMaker complaints** (100M+ and 500M+ downloads respectively) center on: audio distortion, mic permission bugs, Bluetooth latency, too many social/AI features obscuring the core singing flow. People want simple, not a social network.
- **r/singing** and **r/Songwriting** communities regularly ask for simpler ways to record themselves with lyrics visible - not tied to a song catalog.
- The market for "record yourself singing your own words" is underserved vs. the massive karaoke-catalog market.

---

## Competitors

| App | What it does | Gap |
|-----|-------------|-----|
| **Smule** (100M+ downloads) | Sing over licensed songs with scrolling lyrics, share socially | Catalog only, complex, social network overhead, no custom lyrics |
| **StarMaker** (500M+ downloads) | Same as Smule | Same gaps, bot-infested community |
| **Karaoke Sync** (iOS only) | Record voice + custom lyrics, but requires precision timing/syncing each line to the audio | Way too complex for casual use; targeted at Smule power users |
| **SingerPro Teleprompter** (50K downloads, Android) | Scrolling lyrics for live performance | No recording feature |
| **Singa** | Licensed song catalog, karaoke | No custom lyrics |

**Key gap**: No app lets you paste any lyrics → auto-scroll → hit record → done. The closest (Karaoke Sync) requires manually syncing every line to audio timing before you can start recording.

---

## Target Market

- Original songwriters wanting to record demos while reading their own lyrics
- Amateur cover singers who want to practice/share without needing a song catalog
- Worship/church musicians learning new songs
- Language learners practicing songs in a second language
- TikTok/Reels creators who want a simple "singing cover" recording tool

**Where to find first 5 beta users**: r/singing, r/Songwriting, r/WeAreTheMusicMakers, worship music Facebook groups, singer-songwriter communities on Discord

---

## Feasibility

- **Solo buildable in 2-4 weeks** as a mobile-first web app (Next.js or plain React + Web Audio API)
- Core tech: text input → auto-scroll div + CSS animation → `MediaRecorder` API for audio recording → download link or Web Share API
- No App Store approval needed if shipped as a PWA first
- Key risks: cross-browser audio recording quality varies; iOS Safari has historically had Web Audio quirks (though much improved post-2022)
- No backend needed for MVP (local recording, direct download/share)

---

## Monetization

- **Free**: record up to X songs, download audio
- **Pro ($3-5/month or one-time $10)**: unlimited songs, video recording (camera + lyrics overlay), longer recordings, cloud save
- Alternatively: one-time "unlock" IAP if shipped as a native mobile app
- The "share with friends" angle could drive organic growth and justify a "no watermark" pro tier

---

## The Unspoken Insight

**Every successful player in this market knows: customers are not buying recording. They are buying the feeling of being a real singer.**

The stated need: "I want to record myself singing with scrolling lyrics."
The unstated need: "I want to hear myself back and not be embarrassed. I want proof I can do this."

The evidence:
- Smule's headline is "For the Love of Singing" but their premium features are: studio effects, pitch shift, reverb, 50+ filters. The recording is the vessel; the transformation is the product.
- Trustpilot 5-star review: *"I am singing songs I never thought I could sing with great sound effects to make you sound better."* Effects do the emotional heavy lifting.
- r/Songwriting "I hate my voice" thread: 65 upvotes, 89 comments. Recording is the prescription; voice insecurity is the barrier. The gap between how you sound in your head and how you sound on playback is the core emotional problem every app in this space is really solving.
- Singa offers "guide vocals" — training wheels so you don't hear your own failure.
- Karaoke Sync lets you boost your voice volume 7x. Not for quality — to drown out your own doubt.

**The implication for Croon:** Raw recording skips the emotional product. Croon's bet is that sharing *with friends who already accept you* changes the equation — you don't need effects to feel safe with 3 people who already love you. That bet is unproven but potentially correct for the "share with close circle" use case vs. "broadcast to strangers."

---

## 3 Fragile Assumptions the Market Is Built On

**Assumption 1: The hardest part of singing is having the right songs.**

Every competitor's product surface is organized around catalog size. Smule: 15M songs. Singa: "All the songs, any device." StarMaker: millions of tracks across genres.

*What would have to be true for this to be wrong:* A significant segment of users already know exactly what they want to sing — because they wrote it, or they're practicing one specific cover, or they're in a worship band learning a new hymn. For them, the catalog is irrelevant friction.

*Evidence it's already wrong:*
- r/mac thread: user was about to build their own app because no tool supports custom lyrics for their own imported music. No replies — no solution exists.
- The Snapchat hack: users paste their own lyrics. They never needed Smule's catalog.
- r/singing: *"How is there no easy simple website to stack harmonies? I don't need it to be fancy."* No one mentioned wanting more songs — they wanted a simpler tool.

---

**Assumption 2: You need a stranger community to retain users.**

All major players built stranger-to-stranger social networks: duets, followers, global challenges, gifting economies.

*What would have to be true for this to be wrong:* If real retention comes from personal progress or sharing within existing close relationships — not from accumulating strangers' validation.

*Evidence it's already breaking:*
- Trustpilot: *"I only use it at this point because there's nothing better and it's where all my friends are."* That's switching cost, not love. The product is hollow; the sunk social graph keeps people hostage.
- Trustpilot: *"Smule turned into a dating app and psycho social experiment."* (r/SmuleSing thread confirmed this verbatim.)
- The community became a liability: harassment, fake accounts, predators, organized bullying. Multiple Trustpilot reviews describe this with no resolution.

*The opening:* Users who share with the 3 people who already love them bypass the toxic stranger-social problem, the moderation burden, the chicken-and-egg problem, and the graveyard risk simultaneously.

---

**Assumption 3: Audio effects are what users pay for.**

Smule locks solo recording behind VIP. KaraokeSync sells unlimited exports. StarMaker gates voice enhancement. The entire premium model assumes users pay to sound better.

*What would have to be true for this to be wrong:* If the target user is sharing informally — a WhatsApp clip to a group chat, a quick story for close friends — then authenticity is preferred over polish.

*Evidence:*
- The Snapchat hack produces a compressed screen recording. Users shared it anyway.
- Multiple Smule reviews: the app's own processing makes things *worse* — grainy, robotic, crushed. The "premium effects" are a bug, not a feature, for this segment.
- Thread 7 (r/SmuleSing): users turn off the camera entirely, go audio-only. They're not chasing production value.

---

## 5 Investor Questions That Could Destroy This Idea

**Q1: "Smule has 100M downloads and a free tier. Why can't your users just use Smule?"**

*Answer from evidence:* Smule's free tier locks solo recording behind a paywall after 7 days. Free users can only join duets someone else opened with a VIP track — they cannot sing alone for free. Custom lyrics are completely unsupported; only the 15M licensed catalog works. Android audio is systematically degraded (users bought iPhones specifically to use Smule). The product is in active decline per Trustpilot: *"Terrible updates that actively make things worse… insane payment schemes… bugs persisting for almost a decade."*

*Where it still breaks:* Any well-funded startup could add custom lyrics in 6 weeks. This answer is about Smule specifically, not the category. One new competitor shipping this feature destroys Croon's core differentiator.

---

**Q2: "The real competition is TikTok + phone camera. Why build a dedicated app?"**

*Answer from evidence:* TikTok's lyric scroll is for pre-recorded audio synced to video — it doesn't support live singing capture. The specific iOS system failure: when you start screen-recording on iPhone, background audio (Spotify, YouTube) pauses. Thread 1 documents this verbatim. Thread 8 describes trying to record video + karaoke BG audio on the same iPhone into a single clip — still unsolved in hardware or software. Croon fills a system-level gap in iOS/Android audio session management.

*Where it still breaks:* TikTok could ship a "karaoke creator" mode tomorrow. Instagram has Collab audio modes already. These platforms have distribution Croon will never match organically.

---

**Q3: "How do you grow? There's no social graph — you have no viral loop."**

*Answer from evidence:* Croon has no chicken-and-egg problem — it's useful with 1 user on day 1. First 500 users come from high-signal communities: r/singing (actively seeking tools), r/Songwriting (89-comment thread about voice insecurity = latent demand), worship/church music groups (structured, passionate, completely underserved by Smule's social model). The "share with friends" output is the viral loop — every shared clip is an ad with attribution.

*Where it still breaks:* "Share with friends" only creates a loop if the output is visually distinct and has soft attribution (a watermark or "Made with Croon"). WhatsApp audio shares have no visual surface at all. CAC could be high with no other loop.

---

**Q4: "What's the moat? A developer could ship this in a weekend."**

*Answer from evidence:* The technical moat is thin — acknowledged. The behavioral moat builds from users' personal lyric libraries: each custom song timing represents 10-30 minutes of work users won't redo. The durable version of the moat is community around shared lyric sets — worship bands sharing song sheets, cover artists sharing timed lyrics for popular songs. This creates a proprietary content layer competitors can't instantly copy. Smule's real moat isn't technology either — it's 100M users' social graphs.

*Where it still breaks:* A personal lyric library is individual, not networked. It prevents churn but doesn't create network effects. Any Apple/Google/TikTok feature addition makes the moat irrelevant. 12-18 months of thin protection maximum.

---

**Q5: "Users hack this with Snapchat and screen recording already. Why download another app?"**

*Answer from evidence:* The Snapchat hack fails consistently. Thread 1 documents the exact failure mode: iOS audio session conflicts cause background music to pause when screen recording begins. The user cannot reliably get a usable take. An app that reliably solves: [tap record] → [lyrics scroll] → [clip exported] is 10x the Snapchat hack, not 2x. The bar for downloading an app is "does this reliably solve my problem?" — the hack doesn't.

*Where it still breaks:* "Better than a broken hack" only converts users who have already experienced the broken hack and are actively looking for a solution. Discovery is the real problem — not conversion. If no one knows Croon exists, the broken workaround doesn't drive them to it.

---

## Attacking the Two Weakest Answers

**Q2 (TikTok threat) — strongest counter-move:**
Don't compete with TikTok for distribution. Make TikTok the output surface. Ship a "Post to TikTok" button on day one. Croon becomes the recording studio; TikTok is the stage. Users who are already creators use Croon as their pre-production tool. This also creates an organic presence on TikTok that a platform feature can't easily kill — because Croon recordings are identifiable and creators will hashtag them.

**Q4 (moat) — strongest version:**
The community-lyric-set angle is real but requires a product bet. If Croon allows users to publish their custom timed lyrics for a song (e.g. "I timed the lyrics for Hozier's Cherry Wine in my key — here it is"), Croon builds a user-generated karaoke library that no licensed catalog can replicate. This is how Genius built a defensible asset in lyrics: user contributions, not licensing. It's a 12-month product evolution, not a day-one feature — but it's the path to a real moat.

---

## Reddit Thread Index

Full thread data saved at: `~/Obsidian/Work/Croon-Reddit-Research.md`

Key threads:
1. r/NoStupidQuestions — Snapchat hack to record singing with lyrics on screen (exact Croon use case)
2. r/SmuleSing — "Wrong app for what I'm trying to do?" (Bluetooth broken, gave up on Smule)
3. r/SmuleSing — "Bad Recording Quality Only on Smule" (Android audio systematically degraded)
4. r/singing — "Does Smule distort your recording?" (Rode mic user, still sounds terrible)
5. r/Songwriting — "I hate my voice" (65 upvotes, 89 comments — voice insecurity as the core barrier)
6. r/mac — Custom lyrics app search, user about to build their own (no solution existed)
7. r/SmuleSing — Privacy concern: users don't want to show face when recording
8. r/singing — Record video + karaoke BG audio on same iPhone into single clip (unsolved)
9. r/SmuleSing — Smule actively blocks PC usage via Bluestacks detection
10. r/singing — "How is there no simple website to stack harmonies?" (DAW = only answer)
11. r/SmuleSing — "Smule turned into a dating app and psycho social experiment"
