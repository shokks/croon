# Croon

**Status:** Idea
**Created:** 2026-03-13

## Problem

Most people who sing — not professionals, not even serious amateurs, just people who like to sing — have no reliable way to record themselves doing it. The options are either massive (Smule, StarMaker) or broken. Smule locks solo recording behind a paywall after a 7-day trial. Its free tier only lets you join duets someone else opened, which means you can't sing alone without paying. StarMaker has 500M downloads and is, in the words of its own users, "basically TikTok for singing" — public profiles, stranger interactions, live rooms. Neither of these apps lets you bring your own lyrics. They own the catalog; you sing what they have.

So people hack it. There's a Reddit thread — unironic, in r/NoStupidQuestions — where someone asks how to record themselves singing while reading lyrics on screen. Their solution: paste the lyrics into a Snapchat chat, play music on Spotify, and screen-record the whole thing. It works about half the time. The other half, iOS kills the background audio the moment recording starts. No one in the thread had a better answer. The closest anyone gets is "just use Smule" — which doesn't solve the problem at all. On r/mac, another user was about to build their own app from scratch because no existing tool would display their own custom time-synced lyrics over their own imported music file. Not one reply offered a solution.

The pain is sharp and specific: I know what I want to sing, I have the words, I want to see them scroll while I sing, and I want a clip I can send to someone when I'm done. That's it. What exists is either a locked social network built for strangers, a professional DAW with a six-hour learning curve, or a screen-recording hack that fails randomly. None of them are the simple tool this person is asking for.

## Solution

Croon is a mobile-first app with one job: paste your lyrics, hit record, get a clip. You open the app, drop in your lyrics (paste, type, or import from a file), and press record. The lyrics scroll automatically at a pace you can adjust. Your voice is captured. When you're done, you have an audio clip — optionally with a video of the scrolling lyrics overlaid — that you can save locally or share directly to WhatsApp, iMessage, TikTok, or wherever.

That's the whole core experience. No account required to start. No catalog to browse. No duet invitations. No pitch score, no community feed, no strangers. The scroll speed is configurable so you can set it once for a song and it just works on repeat takes. If you want to layer music underneath, you play it on your phone before hitting record — Croon captures the mix. The output is a real file: audio only, or video with the lyrics on screen, ready to send.

The longer-term version of the product is a personal lyric library — songs you've timed and saved, retrievable instantly. And optionally, a public layer where users share timed lyric sets for popular songs, building a community karaoke library through contribution rather than licensing. That's a 12-month evolution. The day-one product is just: paste, scroll, record, share.

## Why This Could Work

- **The workaround confirms real demand.** People are already doing a broken version of this with Snapchat and screen recording. They're not asking for a new kind of app — they're asking for the thing they're already trying to do to actually work.
- **The incumbents are not competitors for this use case.** Smule and StarMaker are stranger-social platforms built around licensed catalogs. Their entire architecture assumes you want their songs. Custom lyrics are structurally absent, not just a missing feature. They can't add it in a sprint without rewriting their content model.
- **No chicken-and-egg problem.** Croon is useful with exactly one user on day one. There's no social graph to bootstrap, no catalog to license, no content to seed. Build it and it works immediately.
- **The target communities are concentrated and reachable.** r/singing, r/Songwriting, worship/church music Facebook groups, singer-songwriter Discord servers. These are specific, passionate, underserved. Getting the first 50 beta users is a few well-placed posts, not a marketing campaign.
- **TikTok can be the output surface, not the competition.** Ship a "Post to TikTok" button on day one. Croon becomes the recording studio; TikTok is the stage. Every clip posted from Croon is organic distribution.

## Why This Could Fail

- **A big platform could ship this as a feature.** TikTok adding a "karaoke creator" mode for Reels, or Instagram adding a lyrics-teleprompter to Stories, would eat the core use case overnight. These platforms have distribution Croon will never match. The window may be 12-18 months before someone notices.
- **The emotional product is missing.** Research shows users don't actually want raw recording — they want to feel like a real singer. Every successful app in this space sells transformation: effects, pitch correction, reverb that makes you sound good. Croon's bet is that sharing with close friends (not strangers) removes the need for that transformation layer. That bet is plausible but unproven.
- **Discovery is the real problem, not the product.** "Better than a broken Snapchat hack" only converts people who (a) have experienced that hack breaking and (b) are actively searching for an alternative. Organic discovery against "karaoke" in the App Store is a fight Croon will lose. Growth requires seeding specific communities aggressively.
- **The technical moat is thin.** Any developer can build this in a weekend. The behavioral moat (personal lyric libraries, accumulated song timing data) takes months to form and doesn't create network effects. It prevents churn but doesn't block a better-funded competitor from showing up.
- **iOS audio sessions are a real technical risk.** The exact failure users experience with the Snapchat hack — iOS killing background audio when recording starts — is a platform-level constraint Croon has to solve. It's solvable (Croon controls the audio session), but it requires careful implementation and testing, and Apple can change behavior in any OS update.

## MVP Scope

- Paste or type lyrics into a text field
- Lyrics auto-scroll at configurable speed during recording
- Tap to start / stop recording (audio via device mic)
- Playback the recording immediately after
- Export audio as a file (download or share sheet)
- Optional: video export with scrolling lyrics overlay on screen
- No account, no login, no backend — everything local on device
- Works on mobile browser (PWA) as the initial ship target; native app later

## Next Steps

- [ ] Build a prototype PWA: lyrics input → auto-scroll → MediaRecorder → download. One screen, no auth, no backend. Ship to 3 people to watch them use it.
- [ ] Post in r/singing and r/Songwriting: "I built a simple tool to record yourself singing with scrolling lyrics — does this solve a real problem for you?" Get 10 people to try it and talk to 3 of them.
- [ ] Validate the iOS audio session: confirm Croon can record mic audio while background music plays without killing it. This is the core technical risk and should be confirmed before any further building.
- [ ] Decide on the emotional product question: ship raw recording first and see if sharing-with-friends makes effects unnecessary, or add basic reverb/EQ on day one to remove that barrier entirely.
- [ ] Check domain and App Store name availability for "Croon" before committing to the name publicly.
