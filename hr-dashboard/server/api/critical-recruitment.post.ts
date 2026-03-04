import { randomUUID } from 'node:crypto'
import { createError, readBody } from 'h3'
import { prisma } from '../utils/db'

type CriticalRecruitment = {
  id: string
  candidateName: string
  position: string
  country: string
  stage: string
  notes?: string
  createdAt: string
}

function requireNonEmptyString(value: unknown, field: string) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw createError({ statusCode: 400, statusMessage: `${field} is required` })
  }
  return value.trim()
}

function optionalTrimmedString(value: unknown) {
  if (value == null) return undefined
  if (typeof value !== 'string') return undefined
  const s = value.trim()
  return s ? s : undefined
}

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as Record<string, unknown> | null
  const candidateName = requireNonEmptyString(body?.candidateName, 'candidateName')
  const position = requireNonEmptyString(body?.position, 'position')
  const country = requireNonEmptyString(body?.country, 'country')
  const stage = requireNonEmptyString(body?.stage, 'stage')
  const notes = optionalTrimmedString(body?.notes)

  const createdAt = new Date()
  const created = await prisma.criticalRecruitment.create({
    data: {
      id: randomUUID(),
      candidateName,
      position,
      country,
      stage,
      notes,
      createdAt
    }
  })

  return { ...created, createdAt: createdAt.toISOString() }
})

