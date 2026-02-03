import { randomUUID } from 'node:crypto'
import { createError, readBody } from 'h3'
import { readJsonArray, writeJsonArray } from '../utils/jsonStore'

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
  const body = (await readBody(event)) as Record<string, unknown> | null
  const candidateName = requireNonEmptyString(body?.candidateName, 'candidateName')
  const position = requireNonEmptyString(body?.position, 'position')
  const country = requireNonEmptyString(body?.country, 'country')
  const stage = requireNonEmptyString(body?.stage, 'stage')

  const items = await readJsonArray<CriticalRecruitment>('critical-recruitment.json')

  const created: CriticalRecruitment = {
    id: randomUUID(),
    candidateName,
    position,
    country,
    stage,
    createdAt: new Date().toISOString()
  }

  items.push(created)
  await writeJsonArray('critical-recruitment.json', items)
  return created
})

