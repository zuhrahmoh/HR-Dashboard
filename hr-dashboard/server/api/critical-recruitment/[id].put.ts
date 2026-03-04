import { createError, getRouterParam, readBody } from 'h3'
import { prisma } from '../../utils/db'

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
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

  const body = (await readBody(event)) as Record<string, unknown> | null
  const candidateName = requireNonEmptyString(body?.candidateName, 'candidateName')
  const position = requireNonEmptyString(body?.position, 'position')
  const country = requireNonEmptyString(body?.country, 'country')
  const stage = requireNonEmptyString(body?.stage, 'stage')
  const notes = optionalTrimmedString(body?.notes)

  const existing = await prisma.criticalRecruitment.findUnique({ where: { id } })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Critical recruitment item not found' })

  const updated = await prisma.criticalRecruitment.update({
    where: { id },
    data: { candidateName, position, country, stage, notes }
  })

  return { ...updated, createdAt: updated.createdAt.toISOString() }
})

