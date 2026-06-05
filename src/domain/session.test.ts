import { describe, expect, it } from 'vitest'
import { deriveSessionSnapshot, type SessionEvent } from './session'

const events: SessionEvent[] = [
  { id: 'start', type: 'session_started', name: 'Deep work', at: 0 },
  { id: 'kivil-1', type: 'kivil_started', durationMs: 5_000, at: 10_000 },
  { id: 'pause', type: 'session_paused', at: 12_000 },
  { id: 'resume', type: 'session_resumed', at: 20_000 },
  { id: 'note', type: 'kivil_note_updated', kivilEventId: 'kivil-1', note: 'Check direction.', at: 21_000 },
  { id: 'done', type: 'kivil_completed', kivilEventId: 'kivil-1', at: 24_000 },
  { id: 'rename', type: 'session_renamed', name: 'Writing sprint', at: 25_000 },
  { id: 'end', type: 'session_ended', at: 30_000 },
]

describe('session engine', () => {
  it('derives elapsed work, Kıvıl, and pause durations from events', () => {
    const snapshot = deriveSessionSnapshot(events, 40_000)

    expect(snapshot.status).toBe('ended')
    expect(snapshot.name).toBe('Writing sprint')
    expect(snapshot.elapsedMs).toBe(22_000)
    expect(snapshot.workMs).toBe(16_000)
    expect(snapshot.kivilMs).toBe(6_000)
    expect(snapshot.pauseMs).toBe(8_000)
    expect(snapshot.kivilCount).toBe(1)
    expect(snapshot.segments.map((segment) => segment.kind)).toEqual(['work', 'kivil', 'pause', 'kivil', 'work'])
  })

  it('pauses the active Kıvıl countdown while the session is paused', () => {
    const snapshot = deriveSessionSnapshot(events.slice(0, 3), 18_000)

    expect(snapshot.status).toBe('paused')
    expect(snapshot.activeKivil?.elapsedMs).toBe(2_000)
    expect(snapshot.activeKivil?.remainingMs).toBe(3_000)
  })

  it('continues the active Kıvıl countdown after resume without counting pause time', () => {
    const snapshot = deriveSessionSnapshot(events.slice(0, 4), 23_000)

    expect(snapshot.status).toBe('running')
    expect(snapshot.activeKivil?.elapsedMs).toBe(5_000)
    expect(snapshot.activeKivil?.remainingMs).toBe(0)
  })
})
