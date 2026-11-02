# Lagless

**Outrun the lag. Route the packet.**

**Play it: [lagless-inky.vercel.app](https://lagless-inky.vercel.app)**

![Lagless](public/og-image.png)

Lagless is a 3D three-lane runner you play in the browser. You pilot a hover craft down a failing network: dodge congestion, jump crates, storm pylons and broken gates, ride the teal relay lanes to refill your latency budget, and climb through five worlds to level 50.

## How to play

| Action | Keyboard | Touch |
| --- | --- | --- |
| Switch lane | `←` `→` or `A` `D` | Swipe left / right |
| Jump | `Space`, `↑` or `W` | Tap or swipe up |
| Character ability | `E` or `Shift` | Ability button, bottom right |

- **Latency budget** is shown in ms. It drains all the time, and fast on red congested lanes. Teal relay lanes and teal diamonds refill it. At 0 ms the run times out.
- **Hull** drops when you hit a hazard. Green crosses repair it.
- **Combos** build while you ride relay lanes and multiply your score. Amber coins add score.

## What's in it

- **Five worlds**, each with its own speed, hazards, palette and scenery: Congestion Zone, Fragmented Grid, Mesh Awakening, Anchor Yards and Clear Channel, with boss waves at levels 25 and 39.
- **Three hover craft**, each with an ability:
  - Dart, Overdrive: double speed and pass straight through hazards
  - Hopper, Hop: jump 200 m ahead and refill 30 ms of latency
  - Anchor, Clear lanes: turn every lane back to a fast lane
- **Checkpoints** from level 10, so a long run can restart part-way rather than at level 1.
- **Daily missions, achievements and best runs**: your top 10 scores on this device.
- **Procedural audio**: music and sound effects are generated live with the Web Audio API. There are no audio files.

## Built with AI

- **[Lovable](https://lovable.dev)** generated the original game from prompts: the engine, the canvas renderer, the UI and the progression systems.
- **[Claude Code](https://claude.com/claude-code)** made the November 2026 updates:
  - the Three.js renderer, the five 3D worlds and the three craft, all built in code from primitives
  - the new runners and world names
  - a full interface redesign, guided by the [unslop](https://github.com/heydamir/unslop) skill by Damir Sokolovsky (CC BY 4.0)
  - the rename to Lagless, guest play and best runs
  - this README and the social preview image

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

React, TypeScript, Vite, Tailwind CSS and [Three.js](https://threejs.org). The game engine (`src/game/engine.ts`) owns all the rules and state; the 3D view (`src/game/three/`) only reads that state each frame, so gameplay and rendering stay separate. There are no model or texture files: every craft, hazard and building is made from simple shapes with flat shading.

Progress, missions and best runs are saved in the browser's `localStorage`. There is no backend and no account.

---

Built with 💜 by [RitaCryptoTips](https://x.com/RitaCryptoTips)
