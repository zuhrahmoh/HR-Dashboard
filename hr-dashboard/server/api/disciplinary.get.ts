import { prisma } from '../utils/db'

type DisciplinaryCase = {
  id: string
  employeeName: string
  department?: string
  caseType?: string
  country?: string
  summary: string
  status: string
  includeInReport: boolean
  createdAt: string
}

export default defineEventHandler(async () => {
  const items = await prisma.disciplinaryCase.findMany({ orderBy: { createdAt: 'desc' } })
  return items.map((v) => ({ ...v, createdAt: v.createdAt.toISOString() }))
})

