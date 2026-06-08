import type { SessionSegment, SessionSettings, SegmentKind } from '../domain/session'
import { formatDuration, formatTime } from '../utils/time'

const getSegmentLabel = (kind: SegmentKind) => {
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

  return '#c0c8cb'
}

const getSegmentTooltip = (segment: SessionSegment, showNotes: boolean) => {
  const details = [
    `${getSegmentLabel(segment.kind)}: ${formatDuration(segment.durationMs)}`,
    `${formatTime(segment.startAt)} - ${formatTime(segment.endAt)}`,
  ]

  if (showNotes && segment.note) {
    details.push(getNotePreview(segment.note))
  }

  return details.join('\n')
}

const getSegmentTimeRange = (segment: SessionSegment) =>
  `${formatTime(segment.startAt)} - ${formatTime(segment.endAt)}`

const getNotePreview = (note: string) => {
  const normalizedNote = note.trim()

  if (normalizedNote.length <= 220) {
    return normalizedNote
  }

  return `${normalizedNote.slice(0, 220).trimEnd()}...`
}

export function SegmentTimeline({
  compact = false,
  segments,
  settings,
  showNotes = true,
}: {
  compact?: boolean
  segments: SessionSegment[]
  settings: SessionSettings
  showNotes?: boolean
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
          aria-label={getSegmentTooltip(segment, showNotes)}
          className={`timeline-segment timeline-${segment.kind}`}
          key={segment.id}
          role="listitem"
          style={{
            background: getSegmentColor(segment, settings),
            flexGrow: segment.durationMs,
          }}
          tabIndex={0}
        >
          <span className="segment-tooltip" role="presentation">
            <span className="tooltip-heading">
              <span
                className="tooltip-dot"
                style={{
                  background: getSegmentColor(segment, settings),
                }}
              />
              <strong>{getSegmentLabel(segment.kind)}</strong>
            </span>
            <span>{formatDuration(segment.durationMs)}</span>
            <span>{getSegmentTimeRange(segment)}</span>
            {showNotes && segment.note ? <em>{getNotePreview(segment.note)}</em> : null}
          </span>
        </div>
      ))}
    </div>
  )
}
