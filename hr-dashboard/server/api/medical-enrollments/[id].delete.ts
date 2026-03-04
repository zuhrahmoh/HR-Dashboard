import { createError, getRouterParam } from 'h3'
import { prisma } from '../../utils/db'

type MedicalEnrollment = {
  id: string
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

  const existing = await prisma.medicalEnrollment.findUnique({ where: { id } })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Medical enrollment not found' })

  await prisma.medicalEnrollment.delete({ where: { id } })
  return { ok: true }
})

