import { useEffect, useMemo, useState } from 'react'
import { Check, Pause, Play, RotateCcw, Sparkles, Square, Trash2, X } from 'lucide-react'
import './App.css'
import { SegmentTimeline } from './components/SegmentTimeline'
import { Sidebar, type SidebarPanel } from './components/Sidebar'
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
} from './domain/session'
import {
  loadSavedSessions,
  loadSettings,
  saveSavedSessions,
  saveSettings,
} from './domain/storage'
import { formatDateTime, formatDuration, formatShortDuration } from './utils/time'

type SessionEventInput = SessionEvent extends infer Event
  ? Event extends SessionEvent
    ? Omit<Event, 'id'>
    : never
  : never

const withId = (event: SessionEventInput): SessionEvent => ({
  ...event,
  id: crypto.randomUUID(),
}) as SessionEvent

const getSessionPrompt = (status: string, hasActiveKivil: boolean) => {
  if (hasActiveKivil) {
    return 'Consolidate your thoughts.'
  }

  if (status === 'paused') {
    return 'Session is paused.'
  }

  if (status === 'ended') {
    return 'Session complete.'
  }

  return 'Your craft deserves undivided attention.'
}

function App() {
  const [events, setEvents] = useState<SessionEvent[]>([])
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>(() => loadSavedSessions())
  const [settings, setSettings] = useState<SessionSettings>(() => loadSettings())
  const [now, setNow] = useState(() => Date.now())
  const [sessionName, setSessionName] = useState('Focus session')
  const [draftNote, setDraftNote] = useState('')
  const [openedSessionId, setOpenedSessionId] = useState<string | null>(null)
  const [activePanel, setActivePanel] = useState<SidebarPanel>(null)

  const snapshot = useMemo(() => deriveSessionSnapshot(events, now), [events, now])
  const hasSession = snapshot.status !== 'empty'
  const canPause = snapshot.status === 'running'
  const canResume = snapshot.status === 'paused'
  const canStartKivil = snapshot.status === 'running' && !snapshot.activeKivil
  const canEnd = snapshot.status === 'running' || snapshot.status === 'paused'
  const headline = getSessionPrompt(snapshot.status, Boolean(snapshot.activeKivil))

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
    setEvents((currentEvents) => [...currentEvents, withId(event)])
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

    setNow(endedAt)
    setOpenedSessionId(savedSession.id)
    setEvents(nextEvents)
    replaceSavedSessions([savedSession, ...savedSessions])
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

  const togglePanel = (panel: Exclude<SidebarPanel, null>) => {
    setActivePanel((currentPanel) => (currentPanel === panel ? null : panel))
  }

  const closePanel = () => setActivePanel(null)

  const renderPanel = () => {
    if (!activePanel) {
      return null
    }

    return (
      <aside className="side-panel" aria-label={`${activePanel} panel`}>
        <div className="side-panel-header">
          <div>
            <p className="segment-label">{activePanel}</p>
            <h2>
              {activePanel === 'history'
                ? 'Saved Sessions'
                : activePanel === 'summaries'
                  ? 'Session Summaries'
                  : 'Workspace Preferences'}
            </h2>
          </div>
          <button className="panel-close" type="button" onClick={closePanel} aria-label="Close panel">
            <X size={18} />
          </button>
        </div>

        {activePanel === 'history' ? (
          savedSessions.length === 0 ? (
            <p className="muted-text">No saved sessions yet.</p>
          ) : (
            <div className="panel-list">
              {savedSessions.map((session) => {
                const savedSnapshot = deriveSessionSnapshot(session.events, session.updatedAt)

                return (
                  <article
                    className={`panel-session ${openedSessionId === session.id ? 'is-open' : ''}`}
                    key={session.id}
                  >
                    <input
                      aria-label="Saved session name"
                      value={session.name}
                      onChange={(event) => renameSavedSession(session.id, event.target.value)}
                    />
                    <span>{formatDateTime(session.createdAt)}</span>
                    <SegmentTimeline compact segments={savedSnapshot.segments} settings={session.settings} />
                    <div className="history-actions">
                      <button type="button" onClick={() => openSavedSession(session)}>
                        <Play size={15} />
                        Open
                      </button>
                      <button type="button" onClick={() => deleteSavedSession(session.id)}>
                        <Trash2 size={15} />
                        Delete
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )
        ) : null}

        {activePanel === 'summaries' ? (
          savedSessions.length === 0 ? (
            <p className="muted-text">End a session to create the first summary.</p>
          ) : (
            <div className="panel-list">
              {savedSessions.map((session) => {
                const savedSnapshot = deriveSessionSnapshot(session.events, session.updatedAt)

                return (
                  <article className="summary-row" key={session.id}>
                    <div>
                      <h3>{session.name}</h3>
                      <span>{formatDateTime(session.createdAt)}</span>
                    </div>
                    <strong>{formatShortDuration(savedSnapshot.elapsedMs)}</strong>
                    <SegmentTimeline compact segments={savedSnapshot.segments} settings={session.settings} />
                  </article>
                )
              })}
            </div>
          )
        ) : null}

        {activePanel === 'settings' ? (
          <div className="panel-form">
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
            <label htmlFor="work-color">Work segment chroma</label>
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
            <label htmlFor="kivil-color">Kıvıl pulse accent</label>
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
          </div>
        ) : null}
      </aside>
    )
  }

  return (
    <main className="kivil-app">
      <Sidebar
        activePanel={activePanel}
        hasSession={hasSession}
        onNewSession={hasSession ? resetPrototype : startSession}
        onTogglePanel={togglePanel}
      />

      <section className="main-stage">
        <header className="stage-header">
          <div>
            {hasSession ? (
              <p className={`state-badge state-${snapshot.activeKivil ? 'kivil' : snapshot.status}`}>
                {snapshot.activeKivil ? 'Reflection period' : snapshot.status}
              </p>
            ) : null}
            <h1>{headline}</h1>
          </div>
          {hasSession ? (
            <div className="stage-total">
              <span>Total elapsed</span>
              <strong>{formatDuration(snapshot.elapsedMs)}</strong>
            </div>
          ) : null}
        </header>

        {!hasSession ? (
          <section className="start-panel" aria-label="Start session">
            <p>Define your focus for this segment. Every block of work becomes part of the record.</p>
            <label htmlFor="session-name">Session name</label>
            <input
              id="session-name"
              value={sessionName}
              onChange={(event) => setSessionName(event.target.value)}
              maxLength={48}
              placeholder="What are you focusing on?"
            />
            <button className="primary-action" type="button" onClick={startSession}>
              Start Session
              <Play size={20} />
            </button>
          </section>
        ) : (
          <div className="session-grid">
            <section className={`timer-panel ${snapshot.status}`} aria-label="Current session">
              <p className="segment-label">
                {snapshot.activeKivil ? 'Kıvıl interval ends in' : `Current segment: ${snapshot.name}`}
              </p>
              <strong className="main-timer">
                {snapshot.activeKivil
                  ? formatDuration(snapshot.activeKivil.remainingMs)
                  : formatDuration(snapshot.elapsedMs)}
              </strong>

              <div className="session-actions">
                {canPause ? (
                  <button className="icon-action" type="button" onClick={pauseSession}>
                    <Pause size={22} />
                    <span>Pause</span>
                  </button>
                ) : null}
                {canResume ? (
                  <button className="primary-action" type="button" onClick={resumeSession}>
                    <Play size={20} />
                    Resume Focus
                  </button>
                ) : null}
                <button className="primary-action" type="button" onClick={startKivil} disabled={!canStartKivil}>
                  <Sparkles size={18} />
                  Start Kıvıl
                </button>
                <button className="icon-action" type="button" onClick={endSession} disabled={!canEnd}>
                  <Square size={20} />
                  <span>End Session</span>
                </button>
                {snapshot.status === 'ended' ? (
                  <button className="icon-action" type="button" onClick={resetPrototype}>
                    <RotateCcw size={20} />
                    <span>New Session</span>
                  </button>
                ) : null}
              </div>

              <div className="session-metrics">
                <div>
                  <span>Work</span>
                  <strong>{formatShortDuration(snapshot.workMs)}</strong>
                </div>
                <div>
                  <span>Kıvıl</span>
                  <strong>{snapshot.kivilCount}</strong>
                </div>
                <div>
                  <span>Paused</span>
                  <strong>{formatShortDuration(snapshot.pauseMs)}</strong>
                </div>
              </div>
            </section>

            {snapshot.activeKivil ? (
              <section className="reflection-panel" aria-label="Kıvıl note">
                <div>
                  <p className="segment-label">Record Reflection</p>
                  <h2>What did this segment change?</h2>
                </div>
                <textarea
                  id="kivil-note"
                  aria-label="Kıvıl note"
                  value={draftNote}
                  onChange={(event) => setDraftNote(event.target.value)}
                  rows={5}
                  placeholder="What did you learn? Any friction points? Next steps?"
                />
                <div className="session-actions compact">
                  <button type="button" onClick={saveKivilNote}>
                    <Check size={16} />
                    Save Note
                  </button>
                  <button className="primary-action amber" type="button" onClick={completeKivil}>
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

            <section className="record-panel" aria-label="Session record">
              <div className="record-header">
                <div>
                  <p className="segment-label">{snapshot.status === 'ended' ? 'Session complete' : 'Live record'}</p>
                  <h2>{snapshot.status === 'ended' ? snapshot.name : 'Chronological record'}</h2>
                </div>
                <span>{formatDateTime(snapshot.startedAt)}</span>
              </div>

              <div className="timeline-shell">
                <SegmentTimeline segments={snapshot.segments} settings={settings} />
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
                  <span>Focused</span>
                  <strong>{formatDuration(snapshot.elapsedMs)}</strong>
                </div>
                <div>
                  <span>Segments</span>
                  <strong>{snapshot.segments.length}</strong>
                </div>
              </div>
            </section>
          </div>
        )}
        {renderPanel()}
      </section>
    </main>
  )
}

export default App
