import { createError, readBody } from 'h3'
import { prisma } from '../utils/db'

type SnapshotInput = {
  employeeName: string
  country?: string
  enrollmentType?: string
  vendor?: string
  stage: string
  dateInitiated?: string
  nextAction?: string
  attachmentsUrl?: string
  createdAt: string
  updatedAt: string
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
  return {
    employeeName: stringField('employeeName', true),
    country: stringField('country', false) || undefined,
    enrollmentType: stringField('enrollmentType', false) || undefined,
    vendor: stringField('vendor', false) || undefined,
    stage: stringField('stage', true),
    dateInitiated: stringField('dateInitiated', false) || undefined,
    nextAction: stringField('nextAction', false) || undefined,
    attachmentsUrl: stringField('attachmentsUrl', false) || undefined,
    createdAt: stringField('createdAt', true),
    updatedAt: stringField('updatedAt', true),
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
    await prisma.medicalEnrollmentReview.deleteMany({ where: { odooLineId } })
    return { ok: true, completed: false }
  }

  const snapshot = validateSnapshot(body?.snapshot)
  const now = new Date()
  await prisma.medicalEnrollmentReview.upsert({
    where: { odooLineId },
    create: { odooLineId, snapshot, completedAt: now },
    update: { snapshot }
  })
  return { ok: true, completed: true }
})
