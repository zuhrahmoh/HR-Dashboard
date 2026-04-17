import { createError, readBody } from 'h3'
import { prisma } from '../utils/db'

const STATUS_VALUES = new Set([
  'not_started',
  'discussion_in_progress',
  'confirmed_for_permanency',
  'contracted_extension',
  'unsuccessful_probation'
])

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as Record<string, unknown> | null
  const rowKey = typeof body?.rowKey === 'string' ? body.rowKey.trim() : ''
  const status = typeof body?.status === 'string' ? body.status.trim() : ''
  if (!rowKey) throw createError({ statusCode: 400, statusMessage: 'rowKey is required' })
  if (!STATUS_VALUES.has(status)) throw createError({ statusCode: 400, statusMessage: 'Invalid status' })

  if (status === 'not_started') {
    await prisma.upcomingContractExpiryStatus.deleteMany({ where: { rowKey } })
  } else {
    await prisma.upcomingContractExpiryStatus.upsert({
      where: { rowKey },
      create: { rowKey, status },
      update: { status }
    })
  }

  return { ok: true }
})
