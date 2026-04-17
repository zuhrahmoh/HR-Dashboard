import { prisma } from '../utils/db'

const STATUS_VALUES = new Set([
  'not_started',
  'discussion_in_progress',
  'confirmed_for_permanency',
  'contracted_extension',
  'unsuccessful_probation'
])

export default defineEventHandler(async () => {
  const rows = await prisma.upcomingContractExpiryStatus.findMany({
    select: { rowKey: true, status: true }
  })
  const statuses: Record<string, string> = {}
  for (const r of rows) {
    if (STATUS_VALUES.has(r.status)) statuses[r.rowKey] = r.status
  }
  return { statuses }
})
