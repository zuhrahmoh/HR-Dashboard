import { createError, getRouterParam, readBody } from 'h3'
import { readJsonArray, writeJsonArray } from '../../utils/jsonStore'

type MedicalEnrollment = {
  id: string
  employeeName: string
  country: string
  enrollmentType?: string
  vendor?: string
  stage: string
  dateInitiated?: string
  nextAction?: string
  hrRepresentative?: string
  notes?: string
  attachmentsUrl?: string
  createdAt: string
  updatedAt: string
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
  const employeeName = requireNonEmptyString(body?.employeeName, 'employeeName')
  const country = requireNonEmptyString(body?.country, 'country')
  const stage = requireNonEmptyString(body?.stage, 'stage')

  const enrollmentType = optionalTrimmedString(body?.enrollmentType)
  const vendor = optionalTrimmedString(body?.vendor)
  const dateInitiated = optionalTrimmedString(body?.dateInitiated)
  const nextAction = optionalTrimmedString(body?.nextAction)
  const hrRepresentative = optionalTrimmedString(body?.hrRepresentative)
  const notes = optionalTrimmedString(body?.notes)
  const attachmentsUrl = optionalTrimmedString(body?.attachmentsUrl)

  const items = await readJsonArray<MedicalEnrollment>('medical-enrollments.json')
  const idx = items.findIndex((v) => v.id === id)
  if (idx === -1) throw createError({ statusCode: 404, statusMessage: 'Medical enrollment not found' })

  const existing = items[idx]
  const updated: MedicalEnrollment = {
    ...existing,
    employeeName,
    country,
    enrollmentType,
    vendor,
    stage,
    dateInitiated,
    nextAction,
    hrRepresentative,
    notes,
    attachmentsUrl,
    updatedAt: new Date().toISOString()
  }

  items[idx] = updated
  await writeJsonArray('medical-enrollments.json', items)
  return updated
})

