# machine-learning-ts

A **TypeScript implementation of a Connect Four game engine** built with **XState**, tested with **Vitest**, and scaffolded with **Vite + React**.

---

## Overview

This project models the rules and flow of a **two-player Connect Four game** using a **finite state machine**.

It focuses on:
- player join/leave flow
- color selection
- game start validation
- token dropping logic
- win detection
- draw detection
- game restart handling
- unit testing of gameplay rules

The UI currently contains the default Vite/React starter screen, while the **real logic lives in the game machine and tests**.

---

## Features

- ⚙️ **Finite state machine architecture** with XState
- 🎮 **Connect Four game rules** implemented in TypeScript
- 🧪 **Automated tests** with Vitest
- 🔄 **Turn switching** between two players
- 🏆 **Winning move detection**
- 🤝 **Lobby flow** for joining and selecting colors
- ♻️ **Restart support** after victory or draw
- ⏱️ **Automatic turn timeout** (20 seconds)

---

## Tech Stack

- **TypeScript**
- **React 18**
- **Vite**
- **XState**
- **Vitest**

---

## Project Structure

```text
machine-learning-ts/
├── public/
├── src/
│   ├── func/
│   │   └── game.ts               # Core game utility functions
│   ├── machine/
│   │   ├── GameMachine.ts        # Main XState game machine
│   │   ├── actions.ts            # State transition actions
│   │   └── guards.ts             # Transition guards / rule validation
│   ├── App.tsx                   # Placeholder Vite React UI
│   ├── main.tsx                  # React entry point
│   └── types.ts                  # Shared game types and enums
├── test/
│   └── machine/
│       └── machine.test.ts       # Unit tests for gameplay logic
├── package.json
└── vite.config.ts