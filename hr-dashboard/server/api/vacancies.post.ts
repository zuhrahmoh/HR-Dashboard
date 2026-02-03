import { randomUUID } from 'node:crypto'
import { createError, readBody } from 'h3'
import { readJsonArray, writeJsonArray } from '../utils/jsonStore'

type Vacancy = {
  id: string
  positionTitle: string
  department: string
  country: string
  priority: string
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
  const positionTitle = requireNonEmptyString(body?.positionTitle, 'positionTitle')
  const department = requireNonEmptyString(body?.department, 'department')
  const country = requireNonEmptyString(body?.country, 'country')
  const priority = requireNonEmptyString(body?.priority, 'priority')

  const items = await readJsonArray<Vacancy>('vacancies.json')

  const created: Vacancy = {
    id: randomUUID(),
    positionTitle,
    department,
    country,
    priority,
    createdAt: new Date().toISOString()
  }

  items.push(created)
  await writeJsonArray('vacancies.json', items)
  return created
})

