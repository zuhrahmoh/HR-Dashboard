import { createError, getRouterParam, readBody } from 'h3'
import { readJsonArray, writeJsonArray } from '../../utils/jsonStore'

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
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

  const body = (await readBody(event)) as Record<string, unknown> | null
  const positionTitle = requireNonEmptyString(body?.positionTitle, 'positionTitle')
  const department = requireNonEmptyString(body?.department, 'department')
  const country = requireNonEmptyString(body?.country, 'country')
  const priority = requireNonEmptyString(body?.priority, 'priority')

  const items = await readJsonArray<Vacancy>('vacancies.json')
  const idx = items.findIndex((v) => v.id === id)
  if (idx === -1) throw createError({ statusCode: 404, statusMessage: 'Vacancy not found' })

  const existing = items[idx]
  const updated: Vacancy = {
    ...existing,
    positionTitle,
    department,
    country,
    priority
  }

  items[idx] = updated
  await writeJsonArray('vacancies.json', items)
  return updated
})

