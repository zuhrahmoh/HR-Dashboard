import { prisma } from '../utils/db'

type CriticalRecruitment = {
  id: string
  candidateName: string
  position: string
  country: string
  stage: string
  notes?: string
  createdAt: string
}

export default defineEventHandler(async () => {
  const items = await prisma.criticalRecruitment.findMany({ orderBy: { createdAt: 'desc' } })
  return items.map((v) => ({ ...v, createdAt: v.createdAt.toISOString() }))
})

