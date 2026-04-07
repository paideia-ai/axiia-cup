const TIMEZONE_SUFFIX_PATTERN = /(Z|[+-]\d{2}:\d{2})$/i

function normalizeTimestamp(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return null
  }

  if (TIMEZONE_SUFFIX_PATTERN.test(trimmed)) {
    return trimmed
  }

  // SQLite CURRENT_TIMESTAMP is UTC, but it omits the explicit timezone.
  if (trimmed.includes(' ')) {
    return `${trimmed.replace(' ', 'T')}Z`
  }

  if (trimmed.includes('T')) {
    return `${trimmed}Z`
  }

  return trimmed
}

export function parseTimestamp(value: string) {
  const normalized = normalizeTimestamp(value)

  if (!normalized) {
    return null
  }

  const date = new Date(normalized)

  return Number.isNaN(date.getTime()) ? null : date
}

export function parseTimestampMs(value: string) {
  return parseTimestamp(value)?.getTime() ?? 0
}

export function formatDateTime(
  value: string,
  options: Intl.DateTimeFormatOptions = {},
) {
  const date = parseTimestamp(value)

  if (!date) {
    return value
  }

  return date.toLocaleString('zh-CN', {
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options,
  })
}

export function formatTimeAgo(value: string, now = Date.now()) {
  const then = parseTimestamp(value)?.getTime()

  if (then == null) {
    return value
  }

  const diffMs = Math.max(0, now - then)
  const diffMin = Math.floor(diffMs / 60_000)

  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin}分钟前`

  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}小时前`

  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}天前`
}
