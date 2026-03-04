/**
 * Compare app active employees (GET /api/odoo/employees) vs Documentation/headcount.csv.
 * Run from repo root with app running: npx tsx hr-dashboard/scripts/compare-headcount-csv.ts
 * Or from hr-dashboard: npx tsx scripts/compare-headcount-csv.ts (set CSV path accordingly)
 */
import { readFileSync } from 'fs'
import { resolve } from 'path'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'
const REPO_ROOT = resolve(import.meta.dirname, '../..')
const CSV_PATH = resolve(REPO_ROOT, 'Documentation/headcount.csv')

function norm(s: string): string {
  return s
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ')
}

function parseCsv(path: string): string[] {
  const text = readFileSync(path, 'utf-8')
  const lines = text.split(/\r?\n/).filter((line) => line.trim())
  const names: string[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!
    const idx = line.indexOf(',')
    const first = idx >= 0 ? line.slice(0, idx).trim() : line.trim()
    const last = idx >= 0 ? line.slice(idx + 1).trim() : ''
    const full = `${first} ${last}`.trim()
    if (full) names.push(full)
  }
  return names
}

async function main() {
  const csvNames = parseCsv(CSV_PATH)
  const csvNorm = new Map<string, string>()
  csvNames.forEach((name) => csvNorm.set(norm(name), name))

  type Emp = { name: string }
  let appEmployees: Emp[] = []
  try {
    const res = await fetch(`${BASE_URL}/api/odoo/employees`)
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
    appEmployees = await res.json()
  } catch (e) {
    console.error('Failed to fetch active employees. Is the app running?', e)
    process.exit(1)
  }

  const appNames = appEmployees.map((e) => e.name)
  const appNorm = new Map<string, string>()
  appNames.forEach((name) => appNorm.set(norm(name), name))

  const inCsvNotApp: string[] = []
  for (const n of csvNorm.keys()) {
    if (!appNorm.has(n)) inCsvNotApp.push(csvNorm.get(n)!)
  }

  const inAppNotCsv: string[] = []
  for (const n of appNorm.keys()) {
    if (!csvNorm.has(n)) inAppNotCsv.push(appNorm.get(n)!)
  }

  console.log('Counts:')
  console.log('  headcount.csv:', csvNames.length)
  console.log('  App (active):', appNames.length)
  console.log('')
  console.log('In headcount.csv but NOT on app (' + inCsvNotApp.length + '):')
  inCsvNotApp.forEach((name) => console.log('  -', name))
  console.log('')
  console.log('On app but NOT in headcount.csv (' + inAppNotCsv.length + '):')
  inAppNotCsv.forEach((name) => console.log('  -', name))
}

main()
