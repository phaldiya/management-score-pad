# CLAUDE.md

## Project Overview

Management Score Pad — a card game scoring app for the Management (Judgement) card game. Tracks bids, results, and cumulative scores across rounds.

## Tech Stack

- **Runtime**: Bun (package manager + script runner)
- **Framework**: React 19 + TypeScript 5.9 (strict mode)
- **Build**: Vite 7 with SWC plugin
- **Styling**: Tailwind CSS 4
- **Forms**: react-hook-form + Zod validation
- **Routing**: react-router-dom (HashRouter, two routes: `/` setup, `/game` play)
- **State**: useReducer + Context API, persisted to localStorage
- **Avatars**: DiceBear (bottts, croodles, pixelArt, lorelei)
- **Linting/Formatting**: Biome 2.4 (single quotes, 2-space indent, 120 char line width)
- **Unit Tests**: Vitest (co-located `*.spec.ts` files in `src/`)
- **E2E Tests**: Playwright (functional + visual regression across 3 viewports)
- **Releases**: semantic-release with conventional commits

## Project Structure

```
src/
├── types/index.ts           # Shared types (AppState, Player, GameRound, etc.)
├── context/                 # AppContext + useReducer
├── components/
│   ├── layout/              # Header
│   ├── setup/               # SetupPage, RestoreGamePopup
│   ├── game/                # GamePage, Scoreboard, PlayFormPopup, etc.
│   └── shared/              # Icons, Kbd, AvatarPicker, ErrorBoundary, popups
├── lib/                     # Pure logic (gameLogic, scoreCalculation, storage, avatars, exportPdf)
e2e/
├── functional/              # User flow tests (58 tests)
└── visual/                  # Screenshot regression (24 tests × 3 viewports)
tests/helpers/               # Shared fixtures and test utilities
```

## Key Commands

```bash
bun run dev                  # Start dev server
bun run build                # Type-check (tsc -b) + Vite build
bun run lint:check           # Biome lint check (no auto-fix)
bun run test                 # Vitest unit tests
bun run test:smoke           # Smoke tests (same as test, used by pre-commit)
bun run e2e:functional       # Playwright functional tests
bun run e2e:visual           # Playwright visual regression tests
bun run e2e:update-snapshots # Update visual regression baselines
bun run verify               # Full check: lint + format + unit + E2E
```

## Git Hooks

- **pre-commit**: frozen install, lint check, smoke tests
- **pre-push**: full verify (lint + format + unit + E2E), security audit

## Commit Messages

- Do NOT include `Co-Authored-By` in commit messages
- Use [Conventional Commits](https://www.conventionalcommits.org/) format:
  - `feat: add new feature`
  - `fix: resolve bug in component`
  - `refactor: restructure module`
  - `test: add/update tests`
  - `chore: update dependencies or configs`
  - `docs: update documentation`
  - `style: formatting, lint fixes (no code change)`
  - `ci: CI/CD pipeline changes`
  - Include scope when relevant: `feat(header): add keyboard icon`
  - Use imperative mood in the subject line

## Auto-Fix

- After editing any file, run `bunx biome check --write <file>` to auto-format and fix indentation

## Code Conventions

- Biome enforces: single quotes, semicolons, trailing commas, organized imports
- TypeScript strict mode with `noUnusedLocals` and `noUnusedParameters`
- Use `tsc -b` (not `tsc --noEmit`) to match CI build behavior
- All buttons must have explicit `type` attribute (Biome a11y)
- Click handlers require keyboard event support
- Unit tests co-located with source (`src/**/*.spec.ts`)
- Visual snapshots stored per viewport: `visual-desktop/`, `visual-tablet/`, `visual-mobile/`
