import { randomUUID } from 'node:crypto'
import { createError, readBody } from 'h3'
import { prisma } from '../utils/db'

type EapReferral = {
  id: string
  employeeName: string
  country: string
  referralSource?: string
  referralDate: string
  reasonCategory: string
  reasonDetails?: string
  programStatus: string
  startDate?: string
  lastFollowUpDate?: string
  nextFollowUpDate?: string
  outcomeNotes?: string
  ownerHr?: string
  referralDocsUrl?: string
  closeDate?: string
  closedReason?: string
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
  const body = (await readBody(event)) as Record<string, unknown> | null
  const employeeName = requireNonEmptyString(body?.employeeName, 'employeeName')
  const country = requireNonEmptyString(body?.country, 'country')
  const referralDate = requireNonEmptyString(body?.referralDate, 'referralDate')
  const reasonCategory = requireNonEmptyString(body?.reasonCategory, 'reasonCategory')
  const programStatus = requireNonEmptyString(body?.programStatus, 'programStatus')

  const referralSource = optionalTrimmedString(body?.referralSource)
  const reasonDetails = optionalTrimmedString(body?.reasonDetails)
  const startDate = optionalTrimmedString(body?.startDate)
  const lastFollowUpDate = optionalTrimmedString(body?.lastFollowUpDate)
  const nextFollowUpDate = optionalTrimmedString(body?.nextFollowUpDate)
  const outcomeNotes = optionalTrimmedString(body?.outcomeNotes)
  const ownerHr = optionalTrimmedString(body?.ownerHr)
  const referralDocsUrl = optionalTrimmedString(body?.referralDocsUrl)
  const closeDate = optionalTrimmedString(body?.closeDate)
  const closedReason = optionalTrimmedString(body?.closedReason)

  const now = new Date()
  const created = await prisma.eapReferral.create({
    data: {
      id: randomUUID(),
      employeeName,
      country,
      referralSource,
      referralDate,
      reasonCategory,
      reasonDetails,
      programStatus,
      startDate,
      lastFollowUpDate,
      nextFollowUpDate,
      outcomeNotes,
      ownerHr,
      referralDocsUrl,
      closeDate,
      closedReason,
      createdAt: now,
      updatedAt: now
    }
  })

  return { ...created, createdAt: created.createdAt.toISOString(), updatedAt: created.updatedAt.toISOString() }
})

