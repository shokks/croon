# Croon

A simple, private iOS app for recording yourself singing: the lyrics follow your voice, your take sounds good the first time you hear it back, and you get a lyric video with the music to send to the people who already love you.

**Status:** ground-up rebuild, native iOS (Swift + SwiftUI). Weeks 1–2 are technical spikes.

## Start here

- [docs/spec/spec-croon-rebuild.md](docs/spec/spec-croon-rebuild.md): what we're building and why, decisions, build order, risks
- [docs/tasks/tasks-rebuild-spikes.md](docs/tasks/tasks-rebuild-spikes.md): the spikes we're running now
- [docs/tasks/roadmap.md](docs/tasks/roadmap.md): roadmap
- [docs/croon.md](docs/croon.md): the problem and the ICP
- [docs/croon-research.md](docs/croon-research.md), [docs/croon-reddit-research.md](docs/croon-reddit-research.md): market and user research
- [docs/design-principles.md](docs/design-principles.md): how Croon should look and feel

## Repo layout

- `docs/`: spec, research, design principles, tasks
- `web/`: Next.js landing page (will also host share links)
- `assets/`: app icon and logo
- `ai-dev-tasks-main/`: prompts for the PRD → tasks workflow

## The v0 MVP

The earlier Expo / React Native MVP, with its PRDs, specs and task lists, is preserved at tag `v0-mvp` and branch `legacy/mvp`. To run it next to this repo:

```bash
git worktree add ../croon-legacy legacy/mvp
cd ../croon-legacy && npm install && npm start
```

---

Built by [88mph](https://88mph.co)
