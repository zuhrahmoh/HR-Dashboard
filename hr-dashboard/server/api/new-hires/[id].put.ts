import { createError, getRouterParam, readBody } from 'h3'
import { readJsonArray, writeJsonArray } from '../../utils/jsonStore'

type NewHire = {
  id: string
  name: string
  position: string
  country: string
  startDate: string
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
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

  const body = (await readBody(event)) as Record<string, unknown> | null
  const name = requireNonEmptyString(body?.name, 'name')
  const position = requireNonEmptyString(body?.position, 'position')
  const country = requireNonEmptyString(body?.country, 'country')
  const startDate = requireNonEmptyString(body?.startDate, 'startDate')
  const status = requireNonEmptyString(body?.status, 'status')

  const items = await readJsonArray<NewHire>('new-hires.json')
  const idx = items.findIndex((v) => v.id === id)
  if (idx === -1) throw createError({ statusCode: 404, statusMessage: 'New hire not found' })

  const existing = items[idx]
  const updated: NewHire = {
    ...existing,
    name,
    position,
    country,
    startDate,
    status
  }

  items[idx] = updated
  await writeJsonArray('new-hires.json', items)
  return updated
})

