import { createError, getRouterParam } from 'h3'
import { prisma } from '../../utils/db'

type EapReferral = {
  id: string
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

  const existing = await prisma.eapReferral.findUnique({ where: { id } })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'EAP referral not found' })

  await prisma.eapReferral.delete({ where: { id } })
  return { ok: true }
})

