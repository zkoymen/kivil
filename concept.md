# Kıvıl Concept

Kıvıl is a desktop focus app for people who do not work in fixed Pomodoro cycles.

The core idea is simple: a work session starts as an open-ended timeline. Time moves forward from zero, like a stopwatch, but the user can insert short reflection intervals whenever they need to regroup. These reflection intervals are not treated as breaks. They are part of the work session, because the goal is to think about the work while staying mentally connected to it.

During a reflection interval, the app can prompt the user to review what has happened so far:

- What did I just finish?
- What am I trying to solve now?
- What changed since I started?
- What is the next useful move?
- Is there a risk, distraction, or unclear point I should handle?

The reflection interval has a configurable default duration, such as five minutes. The user can start one manually at any point. Later, the app may also support soft nudges after a configurable amount of work time, but those nudges should not force a rigid cycle.

The session ends when the user decides the work is done. At the end, the app can show a chronological record of the session: focused work time, reflection intervals, notes, timestamps, and an optional summary. The product should feel more like a thinking companion and work timeline than a productivity timer.

## Initial Product Shape

- Open-ended work sessions instead of predefined Pomodoro blocks.
- A chronological timeline that keeps running through the whole session.
- Manually inserted reflection intervals with configurable duration.
- Reflection intervals counted as part of work, not as breaks.
- Reflection intervals shown as small Kıvıl segments inside the session record.
- Customizable colors for main work segments and Kıvıl reflection segments.
- Optional notes during or after each reflection interval.
- A session summary showing what happened and when.
- Local-first desktop app behavior by default.

## Timer Model

Kıvıl uses two timer layers:

- A large session timer that counts upward from zero and can be paused or resumed.
- A smaller reflection countdown that appears only when a Kıvıl reflection interval is active.

Pausing the main session should pause the active session state clearly. If a reflection countdown is active, the app should make that state visible and avoid losing the interval context.

## Session Record

The end-of-session view should be chronological, but it should feel fuller than a thin line chart. It can show stacked blocks, cards, or a compact timeline ledger where main work segments and Kıvıl reflection segments are visually distinct. Main work blocks and Kıvıl blocks should support user-configurable colors.

## Design Direction

The interface should be quiet, focused, modern, and practical. It should avoid gamified productivity language and avoid treating reflection as rest. The app should help the user remain aware of their work without making the process feel bureaucratic.
