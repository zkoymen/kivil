# Kıvıl Design Brief

## Design Workflow

Kıvıl should be built in two parallel layers:

1. Functional prototype: implement the session engine, timers, event log, pause behavior, Kıvıl intervals, settings, and summary.
2. Visual direction: use an AI UI design tool or design canvas to explore the final look, then translate the chosen design into the existing app structure.

The design tool should guide visual direction, layout, tone, spacing, color, and component treatment. It should not define the product logic or replace the event-based session engine.

## Required Screens

The UI concept must include these screens or states:

- Active session screen.
- Paused session state.
- Active Kıvıl reflection interval state.
- Settings panel for default Kıvıl duration and segment colors.
- End-of-session summary.
- Empty state before starting a session.

## Product Terms

- Product name: Kıvıl
- Main work time: work segment
- Reflection interval: Kıvıl interval
- Summary: session summary

Avoid calling Kıvıl intervals breaks, rests, Pomodoro cycles, or focus blocks.

## Visual Requirements

- Minimal, modern desktop app.
- Calm and serious, not playful or gamified.
- Smooth and polished without feeling decorative.
- Large upward-counting session timer.
- Small countdown timer only while a Kıvıl interval is active.
- Chronological session record that feels substantial, not just a thin line.
- User-customizable colors for work segments and Kıvıl segments.
- Suitable for a Tauri desktop app with a custom app icon and polished window treatment.

## UI Generation Prompt

Use this prompt in Stitch, Figma Make, v0, Uizard, or a similar UI generation tool:

```text
Design a modern minimalist desktop app called "Kıvıl".

Kıvıl is not a Pomodoro app. It is a focus app for open-ended work sessions. The main session timer counts upward from zero and continues until the user ends the session. During a session, the user can manually start a short "Kıvıl interval": a reflection period used to regroup, review progress, and decide the next move. A Kıvıl interval is not a break.

Create a calm, serious, polished desktop UI for a Tauri app. Avoid childish productivity visuals, gamification, hustle language, old desktop chrome, and generic timer-app styling.

Required screens and states:
1. Empty state before starting a session.
2. Active session screen with a large upward-counting elapsed timer.
3. Active Kıvıl interval state with the large session timer still visible and a smaller countdown timer for the Kıvıl interval.
4. Paused session state.
5. Settings panel for default Kıvıl duration, work segment color, and Kıvıl segment color.
6. End-of-session summary with chronological colored blocks, timestamps, durations, and optional notes.

Design details:
- The main work segments should use one customizable color.
- Kıvıl reflection segments should use another customizable color.
- The end summary should be chronological and substantial, like compact cards or block rows, not a thin line chart.
- Primary actions: Start Session, Pause, Resume, Start Kıvıl, End Session.
- Secondary actions: Add Note, Edit Colors, Change Kıvıl Duration.
- Use restrained color, crisp typography, generous but efficient spacing, and smooth desktop-style controls.
- The layout should work well in a medium desktop window around 1000x700.
- Provide enough component structure that it can be implemented in React with Tailwind and Radix UI.
```

## Implementation Rule

When a design artifact is imported later, keep the existing product model and state engine. Adapt the UI components, spacing, colors, and visual hierarchy to match the design; do not replace the app architecture with generated prototype logic.

