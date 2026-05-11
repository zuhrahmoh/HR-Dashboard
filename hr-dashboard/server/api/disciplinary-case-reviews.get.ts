import { prisma } from '../utils/db'

export default defineEventHandler(async () => {
  const rows = await prisma.disciplinaryCaseReview.findMany({
    select: { odooLineId: true, snapshot: true, completedAt: true }
  })
  const completions: Record<string, { completedAt: string; snapshot: unknown }> = {}
  for (const r of rows) {
    completions[r.odooLineId] = {
      completedAt: r.completedAt.toISOString(),
      snapshot: r.snapshot
    }
  }
  return { completions }
})
