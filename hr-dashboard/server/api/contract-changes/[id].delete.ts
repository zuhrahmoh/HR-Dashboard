import { createError, getRouterParam } from 'h3'
import { prisma } from '../../utils/db'

type ContractChange = {
  id: string
  createdAt: string
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

  const existing = await prisma.contractChange.findUnique({ where: { id } })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Contract change not found' })

  await prisma.contractChange.delete({ where: { id } })
  return { ok: true }
})

