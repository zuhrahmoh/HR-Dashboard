import { prisma } from '../utils/db'

type Vacancy = {
  id: string
  positionTitle: string
  department: string
  country: string
  priority: string
  createdAt: string
}

export default defineEventHandler(async () => {
  const items = await prisma.vacancy.findMany({ orderBy: { createdAt: 'desc' } })
  return items.map((v) => ({ ...v, createdAt: v.createdAt.toISOString() }))
})

