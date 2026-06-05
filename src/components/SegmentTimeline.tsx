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

export function SegmentTimeline({
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
