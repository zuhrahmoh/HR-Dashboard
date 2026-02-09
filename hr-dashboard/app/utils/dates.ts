const ymdFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC'
})

export function formatYmdDate(ymd: string) {
  const s = ymd.trim()
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return s
  const year = Number(m[1])
  const monthIndex = Number(m[2]) - 1
  const day = Number(m[3])
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || !Number.isFinite(day)) return s
  return ymdFormatter.format(new Date(Date.UTC(year, monthIndex, day)))
}

export function formatYmdDateOrDash(ymd: string | null | undefined) {
  if (!ymd) return '—'
  const s = String(ymd).trim()
  if (!s) return '—'
  return formatYmdDate(s)
}

