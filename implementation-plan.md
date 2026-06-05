# Kıvıl Implementation Plan

## Recommended Stack

Use Tauri 2 with a React and TypeScript frontend.

Frontend:

- React
- TypeScript
- Vite
- Tailwind CSS
- Radix UI primitives for accessible controls
- Lightweight custom design system components for Kıvıl-specific surfaces

Desktop shell:

- Tauri 2
- Rust only where desktop APIs, persistence, packaging, or native integration are needed

Local data:

- Start with structured local storage during the prototype.
- Move to SQLite when session history, search, or analytics become important.

## Why This Stack

Kıvıl needs to feel modern and smooth without becoming heavy. A web frontend gives fast UI iteration and strong styling control. Tauri gives a smaller desktop shell than a browser-bundling approach and supports app icons, custom windows, native menus, and packaging.

Electron remains a practical option if maximum ecosystem maturity becomes more important than app size. Flutter is viable for a fully custom native-rendered UI, but it would slow the first prototype unless the project intentionally moves into a Dart and Flutter workflow.

## MVP Scope

The first usable prototype should include:

- Start, pause, resume, and end session.
- Large upward-counting session timer.
- Start Kıvıl reflection interval manually.
- Small countdown timer during active Kıvıl interval.
- Configurable default Kıvıl duration.
- Custom colors for work segments and Kıvıl segments.
- Chronological end-of-session summary.
- Optional note per Kıvıl interval.
- Local session persistence.

## Core State Model

Represent the session as an append-only list of events.

Example event types:

- `session_started`
- `session_paused`
- `session_resumed`
- `kivil_started`
- `kivil_completed`
- `kivil_cancelled`
- `note_added`
- `session_ended`

The UI can derive timers, totals, and the summary from this event log. This reduces timer bugs because the app does not need to mutate many separate counters.

## UI Model

The main screen should have:

- A large central elapsed session timer.
- A compact active Kıvıl countdown when reflection is running.
- Primary controls for pause/resume, start Kıvıl, and end session.
- A dense but calm session strip showing work and Kıvıl blocks.
- A small settings surface for duration and segment colors.

The final summary should be chronological but substantial: block rows, colored segment cards, timestamps, durations, and notes. It should not be only a thin line.

## Design Requirements

- Modern desktop feel.
- Custom app icon.
- Avoid old default desktop chrome where possible.
- Use a custom or transparent titlebar after the prototype basics are stable.
- Keep the UI minimal but not empty.
- Use motion carefully: timer transitions and segment insertion can be smooth, but the app should not feel gamified.

## Early Risks

- Timer drift if the implementation relies only on interval increments.
- Confusing pause behavior when a Kıvıl interval is active.
- Over-designing the first version before the core session model is proven.
- Cross-platform titlebar differences if custom chrome is introduced too early.

## First Build Order

1. Scaffold Tauri, React, TypeScript, Vite, and Tailwind.
2. Build the event-based session engine.
3. Build the main timer and Kıvıl countdown.
4. Add the segment summary view.
5. Add color and duration settings.
6. Add local persistence.
7. Add custom app icon and polished desktop window treatment.

