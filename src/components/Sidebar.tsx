import { BarChart3, Clock3, History, Play, Settings2 } from 'lucide-react'
import brandLogo from '../../assets/brand/kivil_logo_transparent.png'

export type SidebarPanel = 'history' | 'summaries' | 'settings' | null

export function Sidebar({
  activePanel,
  hasSession,
  onNewSession,
  onTogglePanel,
}: {
  activePanel: SidebarPanel
  hasSession: boolean
  onNewSession: () => void
  onTogglePanel: (panel: Exclude<SidebarPanel, null>) => void
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
        <button
          className={activePanel === 'history' ? 'is-panel-active' : ''}
          type="button"
          onClick={() => onTogglePanel('history')}
        >
          <History size={22} />
          History
        </button>
        <button
          className={activePanel === 'summaries' ? 'is-panel-active' : ''}
          type="button"
          onClick={() => onTogglePanel('summaries')}
        >
          <BarChart3 size={22} />
          Summaries
        </button>
        <button
          className={activePanel === 'settings' ? 'is-panel-active' : ''}
          type="button"
          onClick={() => onTogglePanel('settings')}
        >
          <Settings2 size={22} />
          Settings
        </button>
      </nav>

      <button className="sidebar-start" type="button" onClick={onNewSession}>
        <Play size={18} />
        {hasSession ? 'New Session' : 'Start Session'}
      </button>
    </aside>
  )
}
