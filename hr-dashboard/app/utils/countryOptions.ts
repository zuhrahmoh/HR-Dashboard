export function ensureUsaOption(values: string[]) {
  const set = new Set<string>()
  for (const v of values ?? []) {
    const s = (v ?? '').trim()
    if (s) set.add(s)
  }
  set.add('USA')
  return Array.from(set).sort((a, b) => a.localeCompare(b))
}

