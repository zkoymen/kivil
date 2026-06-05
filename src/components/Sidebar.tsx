import { BarChart3, Clock3, History, Play, Settings2, Trash2 } from 'lucide-react'
import brandLogo from '../../assets/brand/kivil_logo_transparent.png'
import { deriveSessionSnapshot, type SavedSession } from '../domain/session'
import { formatDateTime, formatShortDuration } from '../utils/time'
import { SegmentTimeline } from './SegmentTimeline'

export function Sidebar({
  hasSession,
  openedSessionId,
  onDeleteSession,
  onNewSession,
  onOpenSession,
  onRenameSession,
  savedSessions,
}: {
  hasSession: boolean
  openedSessionId: string | null
  onDeleteSession: (sessionId: string) => void
  onNewSession: () => void
  onOpenSession: (session: SavedSession) => void
  onRenameSession: (sessionId: string, name: string) => void
  savedSessions: SavedSession[]
}) {
  return (
    <aside className="app-sidebar" aria-label="Kıvıl navigation">
      <div className="brand-lockup">
        <img alt="Kıvıl" className="brand-logo" src={brandLogo} />
        <span>Deep Work</span>
      </div>

      <nav className="sidebar-nav" aria-label="Primary">
        <button className="is-active" type="button">
          <Clock3 size={22} />
          Session
        </button>
        <button type="button">
          <History size={22} />
          History
        </button>
        <button type="button">
          <BarChart3 size={22} />
          Summaries
        </button>
        <button type="button">
          <Settings2 size={22} />
          Settings
        </button>
      </nav>

      <section className="sidebar-history" aria-label="Saved sessions">
        <div className="sidebar-section-title">
          <h2>Saved Sessions</h2>
          <span>{savedSessions.length}</span>
        </div>
        {savedSessions.length === 0 ? (
          <p className="muted-text">No saved sessions yet.</p>
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
                    onChange={(event) => onRenameSession(session.id, event.target.value)}
                  />
                  <span>
                    {formatDateTime(session.createdAt)} · {formatShortDuration(savedSnapshot.elapsedMs)}
                  </span>
                  <SegmentTimeline compact segments={savedSnapshot.segments} settings={session.settings} />
                  <div className="history-actions">
                    <button type="button" onClick={() => onOpenSession(session)}>
                      <Play size={15} />
                      Open
                    </button>
                    <button type="button" onClick={() => onDeleteSession(session.id)}>
                      <Trash2 size={15} />
                      Delete
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <button className="sidebar-start" type="button" onClick={onNewSession}>
        <Play size={18} />
        {hasSession ? 'New Session' : 'Start Session'}
      </button>
    </aside>
  )
}
