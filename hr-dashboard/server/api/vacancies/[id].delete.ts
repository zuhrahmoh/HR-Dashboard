import { createError, getRouterParam } from 'h3'
import { prisma } from '../../utils/db'

type Vacancy = {
  id: string
  positionTitle: string
  department: string
  country: string
  priority: string
  createdAt: string
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

  const existing = await prisma.vacancy.findUnique({ where: { id } })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Vacancy not found' })

  await prisma.vacancy.delete({ where: { id } })
  return { ok: true }
})

