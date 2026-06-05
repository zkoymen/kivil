# Kıvıl

Kıvıl is a local-first desktop focus app prototype for open-ended work sessions and reflection intervals.

The current implementation is a React, TypeScript, and Vite prototype. The session engine is event-log based so timers, summaries, and saved sessions are derived from chronological events instead of manually mutated counters.

## Current Prototype

- Upward-counting session timer.
- Pause and resume.
- Manual Kıvıl reflection intervals.
- Small countdown timer during active Kıvıl intervals.
- Local session saving through `localStorage`.
- Saved session list with rename and delete.
- Work and Kıvıl color settings.
- Horizontal chronological timelines for summaries and history.

## Commands

```bash
npm install
npm run dev
npm test
npm run lint
npm run build
npm run test:smoke
npm run desktop:run
npm run desktop:build
```

## Project Structure

- `src/domain`: Event-log session engine and local persistence helpers.
- `src`: React prototype UI.
- `tests`: Playwright smoke tests.
- `docs`: Project concept, design brief, implementation plan, and prototype scope.
- `docs/screenshots`: Local verification screenshots.
- `assets/brand`: Brand/logo source files.

`docs/guide.md` is intentionally ignored because it is local working guidance for future Codex sessions.

## Desktop Shell

The current desktop shell target is Neutralinojs because it avoids the Rust and Microsoft C++ Build Tools requirement that Tauri needs on Windows.

```bash
npm run desktop:run
npm run desktop:build
```

The Windows Neutralino runtime binary is stored in `bin/neutralino-win_x64.exe`.
