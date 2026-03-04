import { prisma } from '../../utils/db'

function monthKeyFromUtcDate(d: Date) {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export default defineEventHandler(async () => {
  const rows = await prisma.headcountSnapshot.findMany({
    orderBy: { month: 'asc' }
  })

  return {
    items: rows.map((r) => ({
      month: monthKeyFromUtcDate(r.month),
      headcount: r.headcount
    }))
  }
})

