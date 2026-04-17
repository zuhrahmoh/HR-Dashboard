import { createError, readBody } from 'h3'
import { prisma } from '../utils/db'

const STATUS_VALUES = new Set(['no_action', 'in_progress', 'completed'])

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as Record<string, unknown> | null
  const rowKey = typeof body?.rowKey === 'string' ? body.rowKey.trim() : ''
  const status = typeof body?.status === 'string' ? body.status.trim() : ''
  if (!rowKey) throw createError({ statusCode: 400, statusMessage: 'rowKey is required' })
  if (!STATUS_VALUES.has(status)) throw createError({ statusCode: 400, statusMessage: 'Invalid status' })

  if (status === 'no_action') {
    await prisma.newHireCheckinStatus.deleteMany({ where: { rowKey } })
  } else {
    await prisma.newHireCheckinStatus.upsert({
      where: { rowKey },
      create: { rowKey, status },
      update: { status }
    })
  }

  return { ok: true }
})
