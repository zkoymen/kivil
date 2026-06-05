export type SegmentKind = 'work' | 'kivil' | 'pause'

export type SessionStatus = 'empty' | 'running' | 'paused' | 'ended'

export type SessionEventType =
  | 'session_started'
  | 'session_paused'
  | 'session_resumed'
  | 'kivil_started'
  | 'kivil_completed'
  | 'kivil_cancelled'
  | 'kivil_note_updated'
  | 'session_renamed'
  | 'session_ended'

export type BaseSessionEvent = {
  id: string
  at: number
  type: SessionEventType
}

export type SessionStartedEvent = BaseSessionEvent & {
  type: 'session_started'
  name: string
}

export type SessionPausedEvent = BaseSessionEvent & {
  type: 'session_paused'
}

export type SessionResumedEvent = BaseSessionEvent & {
  type: 'session_resumed'
}

export type KivilStartedEvent = BaseSessionEvent & {
  type: 'kivil_started'
  durationMs: number
}

export type KivilCompletedEvent = BaseSessionEvent & {
  type: 'kivil_completed'
  kivilEventId: string
}

export type KivilCancelledEvent = BaseSessionEvent & {
  type: 'kivil_cancelled'
  kivilEventId: string
}

export type KivilNoteUpdatedEvent = BaseSessionEvent & {
  type: 'kivil_note_updated'
  kivilEventId: string
  note: string
}

export type SessionRenamedEvent = BaseSessionEvent & {
  type: 'session_renamed'
  name: string
}

export type SessionEndedEvent = BaseSessionEvent & {
  type: 'session_ended'
}

export type SessionEvent =
  | SessionStartedEvent
  | SessionPausedEvent
  | SessionResumedEvent
  | KivilStartedEvent
  | KivilCompletedEvent
  | KivilCancelledEvent
  | KivilNoteUpdatedEvent
  | SessionRenamedEvent
  | SessionEndedEvent

export type SessionSettings = {
  kivilDurationMs: number
  workColor: string
  kivilColor: string
}

export type SavedSession = {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  events: SessionEvent[]
  settings: SessionSettings
}

export type SessionSegment = {
  id: string
  kind: SegmentKind
  startAt: number
  endAt: number
  durationMs: number
  activeDurationMs: number
  sourceEventId?: string
  note?: string
}

export type ActiveKivilState = {
  eventId: string
  startedAt: number
  durationMs: number
  elapsedMs: number
  remainingMs: number
  note: string
}

export type SessionSnapshot = {
  status: SessionStatus
  name: string
  startedAt: number | null
  endedAt: number | null
  elapsedMs: number
  workMs: number
  kivilMs: number
  pauseMs: number
  kivilCount: number
  activeKivil: ActiveKivilState | null
  segments: SessionSegment[]
}

export const defaultSessionSettings: SessionSettings = {
  kivilDurationMs: 5 * 60 * 1000,
  workColor: '#f3c84b',
  kivilColor: '#5bb8a8',
}

type RuntimeMode = Exclude<SegmentKind, 'pause'>

const sortEvents = (events: SessionEvent[]) =>
  [...events].sort((a, b) => a.at - b.at)

const getEventName = (events: SessionEvent[]) => {
  const started = events.find((event): event is SessionStartedEvent => event.type === 'session_started')
  const renamed = events
    .filter((event): event is SessionRenamedEvent => event.type === 'session_renamed')
    .at(-1)

  return renamed?.name ?? started?.name ?? 'Untitled session'
}

const getLatestKivilNote = (events: SessionEvent[], kivilEventId: string) => {
  const noteEvent = events
    .filter(
      (event): event is KivilNoteUpdatedEvent =>
        event.type === 'kivil_note_updated' && event.kivilEventId === kivilEventId,
    )
    .at(-1)

  return noteEvent?.note ?? ''
}

const createSegment = (
  kind: SegmentKind,
  startAt: number,
  endAt: number,
  sourceEventId?: string,
  note?: string,
): SessionSegment | null => {
  if (endAt <= startAt) {
    return null
  }

  const durationMs = endAt - startAt

  return {
    id: `${kind}-${sourceEventId ?? 'session'}-${startAt}-${endAt}`,
    kind,
    startAt,
    endAt,
    durationMs,
    activeDurationMs: kind === 'pause' ? 0 : durationMs,
    sourceEventId,
    note,
  }
}

export const getActiveKivilEvent = (events: SessionEvent[]) => {
  let active: KivilStartedEvent | null = null

  for (const event of sortEvents(events)) {
    if (event.type === 'kivil_started') {
      active = event
    }

    if (
      (event.type === 'kivil_completed' || event.type === 'kivil_cancelled') &&
      active?.id === event.kivilEventId
    ) {
      active = null
    }

    if (event.type === 'session_ended') {
      active = null
    }
  }

  return active
}

export const getSessionStatus = (events: SessionEvent[]): SessionStatus => {
  const ordered = sortEvents(events)

  if (!ordered.some((event) => event.type === 'session_started')) {
    return 'empty'
  }

  const latestStateEvent = [...ordered]
    .reverse()
    .find((event) =>
      ['session_started', 'session_paused', 'session_resumed', 'session_ended'].includes(event.type),
    )

  if (latestStateEvent?.type === 'session_ended') {
    return 'ended'
  }

  if (latestStateEvent?.type === 'session_paused') {
    return 'paused'
  }

  return 'running'
}

export const deriveSegments = (events: SessionEvent[], now: number): SessionSegment[] => {
  const ordered = sortEvents(events)
  const segments: SessionSegment[] = []
  let currentStart: number | null = null
  let currentKind: SegmentKind | null = null
  let currentMode: RuntimeMode = 'work'
  let modeBeforePause: RuntimeMode = 'work'
  let currentKivilEventId: string | undefined

  const closeCurrent = (endAt: number) => {
    if (currentStart === null || currentKind === null) {
      return
    }

    const note =
      currentKind === 'kivil' && currentKivilEventId
        ? getLatestKivilNote(ordered, currentKivilEventId)
        : undefined
    const segment = createSegment(currentKind, currentStart, endAt, currentKivilEventId, note)

    if (segment) {
      segments.push(segment)
    }
  }

  for (const event of ordered) {
    if (event.type === 'kivil_note_updated' || event.type === 'session_renamed') {
      continue
    }

    if (event.type === 'session_started') {
      currentStart = event.at
      currentKind = 'work'
      currentMode = 'work'
      continue
    }

    if (currentStart === null || currentKind === null) {
      continue
    }

    closeCurrent(event.at)

    if (event.type === 'session_paused') {
      modeBeforePause = currentMode
      currentKind = 'pause'
      currentStart = event.at
      continue
    }

    if (event.type === 'session_resumed') {
      currentKind = modeBeforePause
      currentMode = modeBeforePause
      currentStart = event.at
      continue
    }

    if (event.type === 'kivil_started') {
      currentKind = 'kivil'
      currentMode = 'kivil'
      currentKivilEventId = event.id
      currentStart = event.at
      continue
    }

    if (event.type === 'kivil_completed' || event.type === 'kivil_cancelled') {
      currentKind = 'work'
      currentMode = 'work'
      currentKivilEventId = undefined
      currentStart = event.at
      continue
    }

    if (event.type === 'session_ended') {
      currentStart = null
      currentKind = null
    }
  }

  if (currentStart !== null && currentKind !== null && getSessionStatus(ordered) !== 'ended') {
    closeCurrent(now)
  }

  return segments
}

export const deriveSessionSnapshot = (events: SessionEvent[], now: number): SessionSnapshot => {
  const ordered = sortEvents(events)
  const segments = deriveSegments(ordered, now)
  const status = getSessionStatus(ordered)
  const activeKivilEvent = getActiveKivilEvent(ordered)
  const endedEvent = ordered.findLast((event): event is SessionEndedEvent => event.type === 'session_ended')
  const startedEvent = ordered.find((event): event is SessionStartedEvent => event.type === 'session_started')
  const workMs = segments
    .filter((segment) => segment.kind === 'work')
    .reduce((total, segment) => total + segment.activeDurationMs, 0)
  const kivilMs = segments
    .filter((segment) => segment.kind === 'kivil')
    .reduce((total, segment) => total + segment.activeDurationMs, 0)
  const pauseMs = segments
    .filter((segment) => segment.kind === 'pause')
    .reduce((total, segment) => total + segment.durationMs, 0)
  const activeKivilElapsedMs = activeKivilEvent
    ? segments
        .filter((segment) => segment.kind === 'kivil' && segment.sourceEventId === activeKivilEvent.id)
        .reduce((total, segment) => total + segment.activeDurationMs, 0)
    : 0

  return {
    status,
    name: getEventName(ordered),
    startedAt: startedEvent?.at ?? null,
    endedAt: endedEvent?.at ?? null,
    elapsedMs: workMs + kivilMs,
    workMs,
    kivilMs,
    pauseMs,
    kivilCount: ordered.filter((event) => event.type === 'kivil_started').length,
    activeKivil: activeKivilEvent
      ? {
          eventId: activeKivilEvent.id,
          startedAt: activeKivilEvent.at,
          durationMs: activeKivilEvent.durationMs,
          elapsedMs: activeKivilElapsedMs,
          remainingMs: Math.max(activeKivilEvent.durationMs - activeKivilElapsedMs, 0),
          note: getLatestKivilNote(ordered, activeKivilEvent.id),
        }
      : null,
    segments,
  }
}

export const createSessionEvent = <T extends SessionEvent>(
  event: Omit<T, 'id'>,
  createId = crypto.randomUUID,
): T => ({
  ...event,
  id: createId(),
}) as T
