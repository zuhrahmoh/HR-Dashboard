/** Display `YYYY-MM` as full month + year (e.g. February 2026); pass through other non-empty strings. */
export function formatExpenseMonthLabel(raw: string | null | undefined): string | null {
  const s = (raw ?? '').trim()
  if (!s) return null
  const m = /^(\d{4})-(\d{2})$/.exec(s)
  if (!m) return s
  const y = Number(m[1])
  const mo = Number(m[2])
  if (!Number.isFinite(y) || !Number.isFinite(mo) || mo < 1 || mo > 12) return s
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(y, mo - 1, 1)))
}
