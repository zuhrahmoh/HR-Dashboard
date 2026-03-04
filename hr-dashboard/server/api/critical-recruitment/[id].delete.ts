import { createError, getRouterParam } from 'h3'
import { prisma } from '../../utils/db'

type CriticalRecruitment = {
  id: string
  candidateName: string
  position: string
  country: string
  stage: string
  createdAt: string
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

  const existing = await prisma.criticalRecruitment.findUnique({ where: { id } })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Critical recruitment item not found' })

  await prisma.criticalRecruitment.delete({ where: { id } })
  return { ok: true }
})

