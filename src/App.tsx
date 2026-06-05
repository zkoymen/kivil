import { useEffect, useMemo, useState } from 'react'
import {
  Check,
  Pause,
  Play,
  RotateCcw,
  Settings2,
  Sparkles,
  Square,
  X,
} from 'lucide-react'
import './App.css'
import {
  defaultSessionSettings,
  deriveSessionSnapshot,
  type KivilCancelledEvent,
  type KivilCompletedEvent,
  type KivilNoteUpdatedEvent,
  type KivilStartedEvent,
  type SessionEndedEvent,
  type SessionEvent,
  type SessionPausedEvent,
  type SessionResumedEvent,
  type SessionSettings,
} from './domain/session'

type SessionEventInput = SessionEvent extends infer Event
  ? Event extends SessionEvent
    ? Omit<Event, 'id'>
    : never
  : never

const withId = (event: SessionEventInput): SessionEvent => ({
  ...event,
  id: crypto.randomUUID(),
}) as SessionEvent

const formatDuration = (durationMs: number) => {
  const totalSeconds = Math.max(Math.floor(durationMs / 1000), 0)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const parts = hours > 0 ? [hours, minutes, seconds] : [minutes, seconds]

  return parts.map((part) => String(part).padStart(2, '0')).join(':')
}

const formatTime = (timestamp: number | null) => {
  if (!timestamp) {
    return '—'
  }

  return new Intl.DateTimeFormat('en', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp)
}

const formatDateTime = (timestamp: number | null) => {
  if (!timestamp) {
    return '—'
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(timestamp)
}

const getSegmentLabel = (kind: 'work' | 'kivil' | 'pause') => {
  if (kind === 'kivil') {
    return 'Kıvıl'
  }

  if (kind === 'pause') {
    return 'Paused'
  }

  return 'Work'
}

function App() {
  const [events, setEvents] = useState<SessionEvent[]>([])
  const [settings, setSettings] = useState<SessionSettings>(defaultSessionSettings)
  const [now, setNow] = useState(() => Date.now())
  const [sessionName, setSessionName] = useState('Focus session')
  const [draftNote, setDraftNote] = useState('')

  const snapshot = useMemo(() => deriveSessionSnapshot(events, now), [events, now])
  const hasSession = snapshot.status !== 'empty'
  const canPause = snapshot.status === 'running'
  const canResume = snapshot.status === 'paused'
  const canStartKivil = snapshot.status === 'running' && !snapshot.activeKivil
  const canEnd = snapshot.status === 'running' || snapshot.status === 'paused'

  useEffect(() => {
    const timerId = window.setInterval(() => {
      const tickAt = Date.now()
      setNow(tickAt)
      setEvents((currentEvents) => {
        const currentSnapshot = deriveSessionSnapshot(currentEvents, tickAt)

        if (
          currentSnapshot.status !== 'running' ||
          !currentSnapshot.activeKivil ||
          currentSnapshot.activeKivil.remainingMs > 0
        ) {
          return currentEvents
        }

        const activeId = currentSnapshot.activeKivil.eventId
        const alreadyClosed = currentEvents.some(
          (event) =>
            (event.type === 'kivil_completed' || event.type === 'kivil_cancelled') &&
            event.kivilEventId === activeId,
        )

        if (alreadyClosed) {
          return currentEvents
        }

        return [
          ...currentEvents,
          withId({
            type: 'kivil_completed',
            at: tickAt,
            kivilEventId: activeId,
          }),
        ]
      })
    }, 250)

    return () => window.clearInterval(timerId)
  }, [])

  const appendEvent = (event: SessionEventInput) => {
    setEvents((currentEvents) => [
      ...currentEvents,
      withId(event),
    ])
  }

  const startSession = () => {
    const startedAt = Date.now()
    const name = sessionName.trim() || 'Focus session'

    setNow(startedAt)
    setDraftNote('')
    setEvents([
      withId({
        type: 'session_started',
        at: startedAt,
        name,
      }),
    ])
  }

  const pauseSession = () => {
    appendEvent({
      type: 'session_paused',
      at: Date.now(),
    } satisfies SessionEventInput & Omit<SessionPausedEvent, 'id'>)
  }

  const resumeSession = () => {
    appendEvent({
      type: 'session_resumed',
      at: Date.now(),
    } satisfies SessionEventInput & Omit<SessionResumedEvent, 'id'>)
  }

  const startKivil = () => {
    setDraftNote('')
    appendEvent({
      type: 'kivil_started',
      at: Date.now(),
      durationMs: settings.kivilDurationMs,
    } satisfies SessionEventInput & Omit<KivilStartedEvent, 'id'>)
  }

  const completeKivil = () => {
    if (!snapshot.activeKivil) {
      return
    }

    appendEvent({
      type: 'kivil_completed',
      at: Date.now(),
      kivilEventId: snapshot.activeKivil.eventId,
    } satisfies SessionEventInput & Omit<KivilCompletedEvent, 'id'>)
  }

  const cancelKivil = () => {
    if (!snapshot.activeKivil) {
      return
    }

    appendEvent({
      type: 'kivil_cancelled',
      at: Date.now(),
      kivilEventId: snapshot.activeKivil.eventId,
    } satisfies SessionEventInput & Omit<KivilCancelledEvent, 'id'>)
  }

  const saveKivilNote = () => {
    if (!snapshot.activeKivil) {
      return
    }

    appendEvent({
      type: 'kivil_note_updated',
      at: Date.now(),
      kivilEventId: snapshot.activeKivil.eventId,
      note: draftNote.trim(),
    } satisfies SessionEventInput & Omit<KivilNoteUpdatedEvent, 'id'>)
  }

  const endSession = () => {
    appendEvent({
      type: 'session_ended',
      at: Date.now(),
    } satisfies SessionEventInput & Omit<SessionEndedEvent, 'id'>)
  }

  const resetPrototype = () => {
    setEvents([])
    setDraftNote('')
    setNow(Date.now())
  }

  const updateDuration = (minutes: number) => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      kivilDurationMs: Math.max(minutes, 1) * 60 * 1000,
    }))
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Kıvıl</p>
          <h1>{hasSession ? snapshot.name : 'Start a session'}</h1>
        </div>
        <span className={`status-pill status-${snapshot.status}`}>
          {snapshot.status}
        </span>
      </header>

      {!hasSession ? (
        <section className="start-surface" aria-label="Start session">
          <label htmlFor="session-name">Session name</label>
          <div className="start-row">
            <input
              id="session-name"
              value={sessionName}
              onChange={(event) => setSessionName(event.target.value)}
              maxLength={48}
            />
            <button className="primary-action" type="button" onClick={startSession}>
              <Play size={18} />
              Start Session
            </button>
          </div>
        </section>
      ) : (
        <div className="workspace">
          <section className="timer-surface" aria-label="Current session">
            <div className="timer-stack">
              <span>Elapsed</span>
              <strong>{formatDuration(snapshot.elapsedMs)}</strong>
            </div>

            {snapshot.activeKivil ? (
              <div className="kivil-countdown">
                <div>
                  <span>Kıvıl</span>
                  <strong>{formatDuration(snapshot.activeKivil.remainingMs)}</strong>
                </div>
                <div className="countdown-bar">
                  <span
                    style={{
                      width: `${Math.min(
                        (snapshot.activeKivil.elapsedMs / snapshot.activeKivil.durationMs) * 100,
                        100,
                      )}%`,
                      background: settings.kivilColor,
                    }}
                  />
                </div>
              </div>
            ) : null}

            <div className="control-row">
              {canPause ? (
                <button type="button" onClick={pauseSession}>
                  <Pause size={18} />
                  Pause
                </button>
              ) : null}
              {canResume ? (
                <button type="button" onClick={resumeSession}>
                  <Play size={18} />
                  Resume
                </button>
              ) : null}
              <button type="button" onClick={startKivil} disabled={!canStartKivil}>
                <Sparkles size={18} />
                Start Kıvıl
              </button>
              <button type="button" onClick={endSession} disabled={!canEnd}>
                <Square size={18} />
                End Session
              </button>
              {snapshot.status === 'ended' ? (
                <button type="button" onClick={resetPrototype}>
                  <RotateCcw size={18} />
                  New Session
                </button>
              ) : null}
            </div>
          </section>

          <aside className="settings-surface" aria-label="Session settings">
            <div className="section-title">
              <Settings2 size={18} />
              <h2>Settings</h2>
            </div>
            <label htmlFor="kivil-duration">Kıvıl duration</label>
            <div className="inline-input">
              <input
                id="kivil-duration"
                type="number"
                min="1"
                value={settings.kivilDurationMs / 60_000}
                onChange={(event) => updateDuration(Number(event.target.value))}
              />
              <span>min</span>
            </div>
            <label htmlFor="work-color">Work color</label>
            <input
              id="work-color"
              className="color-input"
              type="color"
              value={settings.workColor}
              onChange={(event) =>
                setSettings((currentSettings) => ({
                  ...currentSettings,
                  workColor: event.target.value,
                }))
              }
            />
            <label htmlFor="kivil-color">Kıvıl color</label>
            <input
              id="kivil-color"
              className="color-input"
              type="color"
              value={settings.kivilColor}
              onChange={(event) =>
                setSettings((currentSettings) => ({
                  ...currentSettings,
                  kivilColor: event.target.value,
                }))
              }
            />
          </aside>

          {snapshot.activeKivil ? (
            <section className="note-surface" aria-label="Kıvıl note">
              <label htmlFor="kivil-note">Kıvıl note</label>
              <textarea
                id="kivil-note"
                value={draftNote}
                onChange={(event) => setDraftNote(event.target.value)}
                rows={3}
              />
              <div className="control-row compact">
                <button type="button" onClick={saveKivilNote}>
                  <Check size={16} />
                  Save Note
                </button>
                <button type="button" onClick={completeKivil}>
                  <Check size={16} />
                  Complete
                </button>
                <button type="button" onClick={cancelKivil}>
                  <X size={16} />
                  Cancel
                </button>
              </div>
            </section>
          ) : null}

          <section className="summary-surface" aria-label="Session record">
            <div className="section-title">
              <h2>{snapshot.status === 'ended' ? 'Session Summary' : 'Session Record'}</h2>
            </div>
            <div className="stats-grid">
              <div>
                <span>Started</span>
                <strong>{formatDateTime(snapshot.startedAt)}</strong>
              </div>
              <div>
                <span>Ended</span>
                <strong>{formatDateTime(snapshot.endedAt)}</strong>
              </div>
              <div>
                <span>Work</span>
                <strong>{formatDuration(snapshot.workMs)}</strong>
              </div>
              <div>
                <span>Kıvıl</span>
                <strong>{snapshot.kivilCount}</strong>
              </div>
            </div>

            <div className="segment-list">
              {snapshot.segments.map((segment) => (
                <article
                  className={`segment-card segment-${segment.kind}`}
                  key={segment.id}
                  style={{
                    borderColor:
                      segment.kind === 'kivil'
                        ? settings.kivilColor
                        : segment.kind === 'work'
                          ? settings.workColor
                          : undefined,
                  }}
                >
                  <div
                    className="segment-marker"
                    style={{
                      background:
                        segment.kind === 'kivil'
                          ? settings.kivilColor
                          : segment.kind === 'work'
                            ? settings.workColor
                            : undefined,
                    }}
                  />
                  <div>
                    <h3>{getSegmentLabel(segment.kind)}</h3>
                    <p>
                      {formatTime(segment.startAt)} - {formatTime(segment.endAt)}
                    </p>
                    {segment.note ? <p className="segment-note">{segment.note}</p> : null}
                  </div>
                  <strong>{formatDuration(segment.durationMs)}</strong>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

export default App
