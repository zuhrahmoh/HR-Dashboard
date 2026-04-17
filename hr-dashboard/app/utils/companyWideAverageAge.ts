export type AvgAgeCountryRow = {
  country: string
  maleAvgAge: number | null
  femaleAvgAge: number | null
  maleCount: number
  femaleCount: number
}

function safeCount(value: unknown) {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
}

export function companyWideAgeAverages(items: AvgAgeCountryRow[] | undefined | null) {
  const list = items ?? []
  let maleSum = 0
  let maleN = 0
  let femaleSum = 0
  let femaleN = 0
  for (const i of list) {
    const mc = safeCount(i.maleCount)
    if (i.maleAvgAge != null && Number.isFinite(i.maleAvgAge) && mc > 0) {
      maleSum += i.maleAvgAge * mc
      maleN += mc
    }
    const fc = safeCount(i.femaleCount)
    if (i.femaleAvgAge != null && Number.isFinite(i.femaleAvgAge) && fc > 0) {
      femaleSum += i.femaleAvgAge * fc
      femaleN += fc
    }
  }
  const maleAvg = maleN > 0 ? maleSum / maleN : null
  const femaleAvg = femaleN > 0 ? femaleSum / femaleN : null

  let sum = 0
  let count = 0
  for (const i of list) {
    const mc = safeCount(i.maleCount)
    if (i.maleAvgAge != null && Number.isFinite(i.maleAvgAge) && mc > 0) {
      sum += i.maleAvgAge * mc
      count += mc
    }
    const fc = safeCount(i.femaleCount)
    if (i.femaleAvgAge != null && Number.isFinite(i.femaleAvgAge) && fc > 0) {
      sum += i.femaleAvgAge * fc
      count += fc
    }
  }
  const overallAvg = count > 0 ? sum / count : null
  return { maleAvg, femaleAvg, overallAvg }
}

export function formatAgeOneDecimal(v: number | null) {
  if (v == null || !Number.isFinite(v)) return '—'
  return v.toFixed(1)
}
