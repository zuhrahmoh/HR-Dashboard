import { prisma } from '../../utils/db'

function monthKeyFromUtcDate(d: Date) {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export default defineEventHandler(async (event) => {
  const body = await readBody<{ headcount: number }>(event)

  if (typeof body?.headcount !== 'number' || !Number.isFinite(body.headcount) || body.headcount < 0) {
    throw createError({ statusCode: 400, message: 'headcount must be a non-negative number' })
  }

  const now = new Date()
  const monthDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))

  const row = await prisma.headcountSnapshot.upsert({
    where: { month: monthDate },
    update: { headcount: Math.round(body.headcount) },
    create: { month: monthDate, headcount: Math.round(body.headcount) }
  })

  return {
    month: monthKeyFromUtcDate(row.month),
    headcount: row.headcount
  }
})
