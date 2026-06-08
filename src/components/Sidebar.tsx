import { BarChart3, Clock3, History, Minimize2, Play, Settings2 } from 'lucide-react'
import type { PointerEventHandler } from 'react'
import brandLogo from '../../assets/brand/kivil_logo_transparent.png'

export type SidebarPanel = 'history' | 'summaries' | 'settings' | null

export function Sidebar({
  activePanel,
  hasSession,
  onEnterCompactMode,
  onNewSession,
  onResizeStart,
  onTogglePanel,
}: {
  activePanel: SidebarPanel
  hasSession: boolean
  onEnterCompactMode: () => void
  onNewSession: () => void
  onResizeStart: PointerEventHandler<HTMLButtonElement>
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
        <button type="button" onClick={onEnterCompactMode}>
          <Minimize2 size={22} />
          Compact
        </button>
      </nav>

      <button className="sidebar-start" type="button" onClick={onNewSession}>
        <Play size={18} />
        {hasSession ? 'New Session' : 'Start Session'}
      </button>
      <button
        aria-label="Resize sidebar"
        className="sidebar-resize-handle"
        onPointerDown={onResizeStart}
        type="button"
      />
    </aside>
  )
}
