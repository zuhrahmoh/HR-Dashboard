import { createError, getRouterParam, readBody } from 'h3'
import { readJsonArray, writeJsonArray } from '../../utils/jsonStore'

type CriticalRecruitment = {
  id: string
  candidateName: string
  position: string
  country: string
  stage: string
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
  const candidateName = requireNonEmptyString(body?.candidateName, 'candidateName')
  const position = requireNonEmptyString(body?.position, 'position')
  const country = requireNonEmptyString(body?.country, 'country')
  const stage = requireNonEmptyString(body?.stage, 'stage')

  const items = await readJsonArray<CriticalRecruitment>('critical-recruitment.json')
  const idx = items.findIndex((v) => v.id === id)
  if (idx === -1) throw createError({ statusCode: 404, statusMessage: 'Critical recruitment item not found' })

  const existing = items[idx]
  const updated: CriticalRecruitment = {
    ...existing,
    candidateName,
    position,
    country,
    stage
  }

  items[idx] = updated
  await writeJsonArray('critical-recruitment.json', items)
  return updated
})

