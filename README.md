# Lagless

**Outrun the lag. Route the packet.**

![Lagless](public/og-image.png)

Lagless is a neon three-lane runner you play in the browser. You are a data packet crossing a failing network. Dodge congestion, jump spam and data storms, ride the blue relay lanes to refill your latency budget, and climb through five network worlds to level 50.

## How to play

| Action | Keyboard | Touch |
| --- | --- | --- |
| Switch lane | `←` `→` or `A` `D` | Swipe left / right |
| Jump | `Space`, `↑` or `W` | Tap or swipe up |
| Character ability | `E` or `Shift` | Ability button, bottom right |

- **Latency budget** drains all the time, and fast on red congested lanes. Blue relay lanes and 💎 relay pickups refill it.
- **Health** drops when you hit an obstacle or stay on a collapsing lane. 💚 pickups restore it.
- **Combos** build while you route cleanly and multiply your score.

## What's in it

- **Five worlds**, each with its own speed, hazards and rules: Congestion Zone, Fragmented Grid, Mesh Awakening, FlexNode Dominion and Optimum Layer, with boss levels at 25 and 39.
- **Three runners**, each with an ability:
  - Warp Runner: hyper speed and obstacle immunity
  - Relay Master: auto-teleports across danger zones
  - Node Engineer: deploys temporary safe platforms
- **Resume nodes**, so a long run can restart from a checkpoint rather than level 1.
- **Daily missions, achievements and a leaderboard** of your best runs on this device.
- **Procedural audio**: music and sound effects are generated live with the Web Audio API. There are no audio files.

## Built with AI

- **[Lovable](https://lovable.dev)** generated the original game from prompts: the engine, the canvas renderer, the UI and the progression systems.
- **[Claude Code](https://claude.com/claude-code)** made the November 2026 update:
  - the rename to Lagless
  - guest play
  - the leaderboard
  - this README and the social preview image
  - lint and dependency cleanup

## Run it locally

Requires Node.js 18 or newer.

```bash
npm ci
npm run dev        # http://localhost:8080
```

Other commands:

```bash
npm test           # unit tests (Vitest)
npm run lint       # ESLint
npm run build      # production build in dist/
```

It deploys to Vercel as a static site with no configuration. `vercel.json` already routes every path to the app.

## Tech

React, TypeScript, Vite, Tailwind CSS and an HTML canvas renderer. Progress, missions and the leaderboard are saved in the browser's `localStorage`. There is no backend and no account.

---

Built with 💜 by [RitaCryptoTips](https://x.com/RitaCryptoTips)
