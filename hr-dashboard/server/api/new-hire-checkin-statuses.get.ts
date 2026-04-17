import { prisma } from '../utils/db'

const STATUS_VALUES = new Set(['no_action', 'in_progress', 'completed'])

export default defineEventHandler(async () => {
  const rows = await prisma.newHireCheckinStatus.findMany({
    select: { rowKey: true, status: true }
  })
  const statuses: Record<string, string> = {}
  for (const r of rows) {
    if (STATUS_VALUES.has(r.status)) statuses[r.rowKey] = r.status
  }
  return { statuses }
})
