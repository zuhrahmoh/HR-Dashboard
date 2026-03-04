import { createError, getRouterParam } from 'h3'
import { prisma } from '../../utils/db'

type DisciplinaryCase = {
  id: string
  employeeName: string
  caseType: string
  summary: string
  status: string
  createdAt: string
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

  const existing = await prisma.disciplinaryCase.findUnique({ where: { id } })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Disciplinary case not found' })

  await prisma.disciplinaryCase.delete({ where: { id } })
  return { ok: true }
})

