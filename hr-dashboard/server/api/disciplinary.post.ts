import { randomUUID } from 'node:crypto'
import { createError, readBody } from 'h3'
import { readJsonArray, writeJsonArray } from '../utils/jsonStore'

type DisciplinaryCase = {
  id: string
  employeeName: string
  caseType: string
  summary: string
  status: string
  createdAt: string
}

function requireNonEmptyString(value: unknown, field: string) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw createError({ statusCode: 400, statusMessage: `${field} is required` })
  }
  return value.trim()
}

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as Record<string, unknown> | null
  const employeeName = requireNonEmptyString(body?.employeeName, 'employeeName')
  const caseType = requireNonEmptyString(body?.caseType, 'caseType')
  const summary = requireNonEmptyString(body?.summary, 'summary')
  const status = requireNonEmptyString(body?.status, 'status')

  const items = await readJsonArray<DisciplinaryCase>('disciplinary-cases.json')

  const created: DisciplinaryCase = {
    id: randomUUID(),
    employeeName,
    caseType,
    summary,
    status,
    createdAt: new Date().toISOString()
  }

  items.push(created)
  await writeJsonArray('disciplinary-cases.json', items)
  return created
})

