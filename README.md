# Management Score Pad

[![Deploy to GitHub Pages](https://github.com/phaldiya/management-score-pad/actions/workflows/deploy.yml/badge.svg)](https://github.com/phaldiya/management-score-pad/actions/workflows/deploy.yml) [![GitHub Pages](https://img.shields.io/badge/demo-GitHub%20Pages-blue)](https://phaldiya.github.io/management-score-pad/) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/) [![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev/) [![Bun](https://img.shields.io/badge/Bun-runtime-f9f1e1?logo=bun)](https://bun.sh/)

Score tracking app for the **Management** (a.k.a. **Judgement**) card game. Enter player names, track bids and results round by round, and see live cumulative standings with automatic score calculation.

## Game Rules

| Rule | Detail |
|---|---|
| Players | 3–6 |
| Max cards per player | `floor(52 / numPlayers)` |
| Card sequence | `y, y-1, ..., 2, 1, 2, ..., y-1, y` (total `2y - 1` rounds) |
| Trump rotation | Spades -> Hearts -> Clubs -> Diamonds (repeating) |
| Score (bid = result, bid > 0) | `bid * 10` |
| Score (bid = result, bid = 0) | `10` |
| Score (bid != result) | `0` |
| Bid constraint | Total bids across all players != card count |
| Result constraint | Total results across all players = card count |

## Features

- 3–6 player support with dynamic add/remove and reorder before first round
- Visual playing card display with trump suit and card count
- Bid entry with validation (total bids cannot equal card count)
- Result entry with validation (total results must equal card count)
- Automatic score calculation and cumulative standings
- Crown indicator for the current leader
- Dealer rotation tracking
- Game restore from localStorage on page reload
- Transfer game to another device via QR code or shareable link
- Import transferred game with validation and active-game warnings
- Download scoreboard as PDF
- Winner celebration with confetti animation on game completion

## Tech Stack

- **Runtime**: Bun
- **Build**: Vite 7.3 + @vitejs/plugin-react-swc
- **Framework**: React 19 + TypeScript 5.9
- **Routing**: react-router-dom 7 (HashRouter)
- **State**: useReducer + Context API + localStorage
- **Styling**: Tailwind CSS v4
- **Forms**: react-hook-form + zod
- **Lint/Format**: Biome 2.4

## Getting Started

```bash
bun install
bun run dev
```

App runs at [http://localhost:5005/management-score-pad/](http://localhost:5005/management-score-pad/).

## Testing

- **Unit**: Vitest — `bun run test`
- **E2E**: Playwright — `bun run e2e`
- **Verify all**: `bun run verify` (unit + E2E)

| Command | Description |
|---|---|
| `bun run test` | Run all unit tests |
| `bun run test:watch` | Run unit tests in watch mode |
| `bun run test:smoke` | Run smoke tests only |
| `bun run test:deep` | Run deep tests only |
| `bun run test:coverage` | Run unit tests with coverage |
| `bun run e2e` | Run all E2E tests |
| `bun run e2e:functional` | Run functional E2E tests |
| `bun run e2e:visual` | Run visual regression E2E tests |
| `bun run e2e:update-snapshots` | Update visual regression snapshots |
| `bun run e2e:ui` | Open Playwright UI mode |

## Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start dev server |
| `bun run build` | Type-check and build for production |
| `bun run preview` | Preview production build |
| `bun run lint` | Lint and auto-fix with Biome |
| `bun run lint:check` | Check lint without fixing |
| `bun run format` | Format with Biome |
| `bun run verify` | Run unit tests + E2E tests |
| `bun run setup-hooks` | Install git hooks |
