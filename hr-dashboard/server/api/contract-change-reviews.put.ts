import { createError, readBody } from 'h3'
import { prisma } from '../utils/db'

type SnapshotInput = {
  employeeName: string
  country?: string
  department: string
  position: string
  changeTypes: string[]
  status?: string
  description: string
  createdAt: string
  lastModifiedAt: string
  lastModifiedBy: string
}

function validateSnapshot(input: unknown): SnapshotInput {
  if (!input || typeof input !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'snapshot is required when completing' })
  }
  const s = input as Record<string, unknown>
  const stringField = (key: string, required: boolean): string => {
    const value = s[key]
    if (typeof value === 'string') return value
    if (!required && (value === undefined || value === null)) return ''
    throw createError({ statusCode: 400, statusMessage: `snapshot.${key} must be a string` })
  }
  const rawChangeTypes = s.changeTypes
  if (!Array.isArray(rawChangeTypes) || rawChangeTypes.some((v) => typeof v !== 'string')) {
    throw createError({ statusCode: 400, statusMessage: 'snapshot.changeTypes must be string[]' })
  }
  return {
    employeeName: stringField('employeeName', true),
    country: stringField('country', false) || undefined,
    department: stringField('department', true),
    position: stringField('position', true),
    changeTypes: rawChangeTypes as string[],
    status: stringField('status', false) || undefined,
    description: stringField('description', true),
    createdAt: stringField('createdAt', true),
    lastModifiedAt: stringField('lastModifiedAt', true),
    lastModifiedBy: stringField('lastModifiedBy', false)
  }
}

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as Record<string, unknown> | null
  const odooLineId = typeof body?.odooLineId === 'string' ? body.odooLineId.trim() : ''
  const completed = body?.completed === true

  if (!odooLineId) {
    throw createError({ statusCode: 400, statusMessage: 'odooLineId is required' })
  }

  if (!completed) {
    await prisma.contractChangeReview.deleteMany({ where: { odooLineId } })
    return { ok: true, completed: false }
  }

  const snapshot = validateSnapshot(body?.snapshot)
  const now = new Date()
  await prisma.contractChangeReview.upsert({
    where: { odooLineId },
    create: { odooLineId, snapshot, completedAt: now },
    update: { snapshot }
  })
  return { ok: true, completed: true }
})
