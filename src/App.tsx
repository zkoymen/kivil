import { useEffect, useMemo, useState } from 'react'
import {
  Check,
  Pause,
  Play,
  RotateCcw,
  Settings2,
  Sparkles,
  Square,
  Trash2,
  X,
} from 'lucide-react'
import './App.css'
import {
  deriveSessionSnapshot,
  type KivilCancelledEvent,
  type KivilCompletedEvent,
  type KivilNoteUpdatedEvent,
  type KivilStartedEvent,
  type SavedSession,
  type SessionEndedEvent,
  type SessionEvent,
  type SessionPausedEvent,
  type SessionResumedEvent,
  type SessionSettings,
  type SessionSegment,
} from './domain/session'
import {
  loadSavedSessions,
  loadSettings,
  saveSavedSessions,
  saveSettings,
} from './domain/storage'

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

const getSegmentColor = (segment: SessionSegment, settings: SessionSettings) => {
  if (segment.kind === 'kivil') {
    return settings.kivilColor
  }

  if (segment.kind === 'work') {
    return settings.workColor
  }

  return '#c9c0b2'
}

const getSegmentTooltip = (segment: SessionSegment) => {
  const details = [
    `${getSegmentLabel(segment.kind)}: ${formatDuration(segment.durationMs)}`,
    `${formatTime(segment.startAt)} - ${formatTime(segment.endAt)}`,
  ]

  if (segment.note) {
    details.push(segment.note)
  }

  return details.join('\n')
}

function SegmentTimeline({
  compact = false,
  segments,
  settings,
}: {
  compact?: boolean
  segments: SessionSegment[]
  settings: SessionSettings
}) {
  const totalDuration = segments.reduce((total, segment) => total + segment.durationMs, 0)

  if (segments.length === 0 || totalDuration === 0) {
    return <div className={`timeline-empty ${compact ? 'is-compact' : ''}`} />
  }

  return (
    <div
      aria-label="Session timeline"
      className={`session-timeline ${compact ? 'is-compact' : ''}`}
      role="list"
    >
      {segments.map((segment) => (
        <div
          aria-label={getSegmentTooltip(segment)}
          className={`timeline-segment timeline-${segment.kind}`}
          key={segment.id}
          role="listitem"
          style={{
            background: getSegmentColor(segment, settings),
            flexGrow: segment.durationMs,
          }}
          tabIndex={0}
          title={getSegmentTooltip(segment)}
        />
      ))}
    </div>
  )
}

function App() {
  const [events, setEvents] = useState<SessionEvent[]>([])
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>(() => loadSavedSessions())
  const [settings, setSettings] = useState<SessionSettings>(() => loadSettings())
  const [now, setNow] = useState(() => Date.now())
  const [sessionName, setSessionName] = useState('Focus session')
  const [draftNote, setDraftNote] = useState('')
  const [openedSessionId, setOpenedSessionId] = useState<string | null>(null)

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

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  const replaceSavedSessions = (sessions: SavedSession[]) => {
    setSavedSessions(sessions)
    saveSavedSessions(sessions)
  }

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
    setOpenedSessionId(null)
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
    const endedAt = Date.now()
    const nextEvents = [
      ...events,
      withId({
        type: 'session_ended',
        at: endedAt,
      } satisfies SessionEventInput & Omit<SessionEndedEvent, 'id'>),
    ]
    const endedSnapshot = deriveSessionSnapshot(nextEvents, endedAt)
    const savedSession: SavedSession = {
      id: crypto.randomUUID(),
      name: endedSnapshot.name,
      createdAt: endedSnapshot.startedAt ?? endedAt,
      updatedAt: endedAt,
      events: nextEvents,
      settings,
    }
    const nextSavedSessions = [savedSession, ...savedSessions]

    setNow(endedAt)
    setOpenedSessionId(savedSession.id)
    setEvents(nextEvents)
    replaceSavedSessions(nextSavedSessions)
  }

  const resetPrototype = () => {
    setEvents([])
    setDraftNote('')
    setOpenedSessionId(null)
    setNow(Date.now())
  }

  const openSavedSession = (session: SavedSession) => {
    setEvents(session.events)
    setSettings(session.settings)
    setSessionName(session.name)
    setDraftNote('')
    setOpenedSessionId(session.id)
    setNow(Date.now())
  }

  const renameSavedSession = (sessionId: string, name: string) => {
    const trimmedName = name.trim() || 'Untitled session'
    const renamedAt = now
    const nextSavedSessions = savedSessions.map((session) => {
      if (session.id !== sessionId) {
        return session
      }

      const renamedEvents = [
        ...session.events,
        withId({
          type: 'session_renamed',
          at: renamedAt,
          name: trimmedName,
        }),
      ]

      return {
        ...session,
        name: trimmedName,
        updatedAt: renamedAt,
        events: renamedEvents,
      }
    })

    replaceSavedSessions(nextSavedSessions)

    if (openedSessionId === sessionId) {
      const openedSession = nextSavedSessions.find((session) => session.id === sessionId)

      if (openedSession) {
        setEvents(openedSession.events)
        setSessionName(openedSession.name)
      }
    }
  }

  const deleteSavedSession = (sessionId: string) => {
    const nextSavedSessions = savedSessions.filter((session) => session.id !== sessionId)

    replaceSavedSessions(nextSavedSessions)

    if (openedSessionId === sessionId) {
      resetPrototype()
    }
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

          <aside className="history-surface" aria-label="Saved sessions">
            <div className="section-title">
              <h2>Saved Sessions</h2>
            </div>
            {savedSessions.length === 0 ? (
              <p className="muted-text">No saved sessions</p>
            ) : (
              <div className="history-list">
                {savedSessions.map((session) => {
                  const savedSnapshot = deriveSessionSnapshot(session.events, session.updatedAt)

                  return (
                    <article
                      className={`history-row ${openedSessionId === session.id ? 'is-open' : ''}`}
                      key={session.id}
                    >
                      <input
                        aria-label="Saved session name"
                        value={session.name}
                        onChange={(event) => renameSavedSession(session.id, event.target.value)}
                      />
                      <span>
                        {formatDateTime(session.createdAt)} · {formatDuration(savedSnapshot.elapsedMs)}
                      </span>
                      <SegmentTimeline compact segments={savedSnapshot.segments} settings={session.settings} />
                      <div className="history-actions">
                        <button type="button" onClick={() => openSavedSession(session)}>
                          <Play size={16} />
                          Open
                        </button>
                        <button type="button" onClick={() => deleteSavedSession(session.id)}>
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
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

            <div className="timeline-shell">
              <SegmentTimeline segments={snapshot.segments} settings={settings} />
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

export default App
