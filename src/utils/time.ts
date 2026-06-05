export const formatDuration = (durationMs: number) => {
  const totalSeconds = Math.max(Math.floor(durationMs / 1000), 0)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const parts = hours > 0 ? [hours, minutes, seconds] : [minutes, seconds]

  return parts.map((part) => String(part).padStart(2, '0')).join(':')
}

export const formatShortDuration = (durationMs: number) => {
  const totalMinutes = Math.max(Math.round(durationMs / 60_000), 0)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0) {
    return `${minutes}m`
  }

  if (minutes === 0) {
    return `${hours}h`
  }

  return `${hours}h ${minutes}m`
}

export const formatTime = (timestamp: number | null) => {
  if (!timestamp) {
    return '-'
  }

  return new Intl.DateTimeFormat('en', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp)
}

export const formatDateTime = (timestamp: number | null) => {
  if (!timestamp) {
    return '-'
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(timestamp)
}
