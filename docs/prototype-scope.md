# Kıvıl Prototype Scope

## Prototype Goal

Build a working local-first prototype that proves Kıvıl's core behavior before final visual design is applied.

The first prototype should be functional, testable, and internally clean. The UI can be minimal at first, because the final visual direction will be applied later from an external design artifact.

## Core Product Behavior

- No login, account, cloud sync, or remote backend.
- The app works immediately after opening on the user's computer.
- Every completed session is saved locally, even if it lasts only one minute.
- Sessions can be reviewed later.
- Saved sessions can be renamed.
- Saved sessions can be deleted.
- Session data should remain on the device unless the user explicitly exports or deletes it.

## MVP Features

- Start a new open-ended work session.
- Show a large elapsed timer that counts upward from zero.
- Pause and resume the main session.
- Start a Kıvıl interval manually during a session.
- Show a small countdown timer while a Kıvıl interval is active.
- Pause behavior must preserve the active Kıvıl interval context.
- End a session manually.
- Save the ended session locally.
- List saved sessions.
- Rename saved sessions.
- Delete saved sessions.
- Open a saved session summary.
- Configure default Kıvıl duration.
- Configure work segment color.
- Configure Kıvıl segment color.

## Session Summary Requirements

The summary should be chronological and substantial.

It should include:

- Session name.
- Start timestamp.
- End timestamp.
- Total elapsed duration.
- Active work duration.
- Kıvıl interval count.
- Chronological segment blocks for work, pause, and Kıvıl intervals.
- Optional notes attached to Kıvıl intervals.

The summary should not be only a thin line chart.

## Event Log Model

Use an append-only event log as the source of truth.

Required event types:

- `session_started`
- `session_paused`
- `session_resumed`
- `kivil_started`
- `kivil_completed`
- `kivil_cancelled`
- `kivil_note_updated`
- `session_renamed`
- `session_ended`

The UI should derive elapsed timers, segment blocks, totals, and summaries from these events.

## Local Storage Strategy

Prototype persistence can use browser `localStorage` so the React prototype works immediately.

When the Tauri shell is added, persistence can move to a local file or SQLite database without changing the session model.

## Out Of Scope For The First Prototype

- Login or user accounts.
- Cloud sync.
- Mobile app.
- Analytics dashboards.
- Export formats.
- System tray controls.
- Native notifications.
- Final custom titlebar.
- Final brand visuals.

