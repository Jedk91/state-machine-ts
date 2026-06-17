# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start Vite dev server
npm run build     # tsc + vite build
npm test          # run Vitest (watch mode)
npx vitest run    # run tests once (CI-style)
npx vitest run test/machine/machine.test.ts  # run a single test file
```

## Architecture

This is a Connect Four (Puissance 4) game implemented as an XState v4 state machine with a React/Vite frontend.

### State machine (`src/machine/`)

The machine is built with `createModel` (XState v4 model pattern), not the v5 `setup()` API:

- **`GameMachine.ts`** — defines `GameModel` (context + typed events) and `GameMachine` (states/transitions). Also exports `makeGame()`, a test helper that starts an interpreted machine in a given state with partial context.
- **`actions.ts`** — pure functions returning `Partial<GameContext>`; used inside `GameModel.assign(...)`.
- **`guards.ts`** — predicate functions (`GameGuard<T>`) that control whether a transition fires.

### State flow

```
LOBBY ──start──► PLAY ──isWinningMove──► VICTORY ──restart──► LOBBY
                   │ ──isDrawMove──► DRAW ──restart──► LOBBY
                   │ ──canDrop (normal)──► PLAY (self-transition + switchPlayer)
                   └─ after 20 s ──► PLAY (self-transition, switchPlayer via timeout)
```

### Pure game logic (`src/func/game.ts`)

Stateless helpers used by both guards and actions:
- `freePositionY` — finds the lowest empty row in a column
- `winningPositions` — checks 4 directions from the just-dropped position; returns winning cells or `[]`
- `countEmptyCells` — used by the draw guard
- `currentPlayer` — resolves `context.currentPlayer` id to a `Player` object

### Types (`src/types.ts`)

Key types: `GameContext` (inferred from `GameModel`), `GameEvents`, `GameGuard<T>`, `GameAction<T>`, `GridState` (`CellState[][]`), `Position`. Grid cells are `'E'` (empty), `'R'` (red), or `'Y'` (yellow).

### Testing pattern

Tests use `makeGame(state, partialContext)` to bootstrap the machine mid-flow, avoiding the need to replay every preceding event. Guards are evaluated in order on `dropToken`; `isDrawMoveGuard` is checked before `isWinningMoveGuard`.
