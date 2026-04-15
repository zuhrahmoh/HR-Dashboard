import type { RouteLocationNormalized } from 'vue-router'

export function firstQueryString(raw: unknown) {
  if (typeof raw === 'string') return raw.trim()
  if (Array.isArray(raw)) {
    const s = raw.find((v): v is string => typeof v === 'string')
    return (s ?? '').trim()
  }
  return ''
}

export function parseYyyyMm(raw: unknown) {
  const s = firstQueryString(raw)
  return /^\d{4}-\d{2}$/.test(s) ? s : ''
}

export function recruitmentDeeplinkScrollId(
  route: Pick<RouteLocationNormalized, 'path' | 'query' | 'hash'>
): '' | 'recent-separations' | 'recent-new-hires' {
  const path = (route.path ?? '').replace(/\/$/, '') || '/'
  if (path !== '/recruitment') return ''
  const section = firstQueryString(route.query.section)
  const hashId = (route.hash ?? '').replace(/^#/, '')
  if (
    section === 'recent-separations' ||
    hashId === 'recent-separations' ||
    hashId === 'recent-separations-table'
  ) {
    return 'recent-separations'
  }
  if (
    section === 'recent-new-hires' ||
    hashId === 'recent-new-hires' ||
    hashId === 'recent-new-hires-table'
  ) {
    return 'recent-new-hires'
  }
  return ''
}
