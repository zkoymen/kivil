import {
  defaultSessionSettings,
  type SavedSession,
  type SessionEvent,
  type SessionSettings,
} from './session'

const sessionsKey = 'kivil.sessions.v1'
const settingsKey = 'kivil.settings.v1'
const activeSessionKey = 'kivil.active-session.v1'

export type ActiveSessionDraft = {
  events: SessionEvent[]
  settings: SessionSettings
  sessionName: string
  openedSessionId: string | null
  draftNote: string
  updatedAt: number
}

const readJson = <T>(key: string, fallback: T): T => {
  try {
    const value = window.localStorage.getItem(key)

    if (!value) {
      return fallback
    }

    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

const writeJson = <T>(key: string, value: T) => {
  window.localStorage.setItem(key, JSON.stringify(value))
}

export const loadSavedSessions = () => readJson<SavedSession[]>(sessionsKey, [])

export const saveSavedSessions = (sessions: SavedSession[]) => {
  writeJson(sessionsKey, sessions)
}

export const loadSettings = (): SessionSettings => ({
  ...defaultSessionSettings,
  ...readJson<Partial<SessionSettings>>(settingsKey, {}),
})

export const saveSettings = (settings: SessionSettings) => {
  writeJson(settingsKey, settings)
}

export const loadActiveSessionDraft = () => readJson<ActiveSessionDraft | null>(activeSessionKey, null)

export const saveActiveSessionDraft = (draft: ActiveSessionDraft) => {
  writeJson(activeSessionKey, draft)
}

export const clearActiveSessionDraft = () => {
  window.localStorage.removeItem(activeSessionKey)
}
