import { createError, getRouterParam, readBody } from 'h3'
import { prisma } from '../../utils/db'
import { getOdooEmployeeByKey } from '../../utils/odooEmployees'

type CPlayerNote = {
  employeeKey: string
  note: string
  updatedAt: string
}

function requireString(value: unknown, field: string) {
  if (typeof value !== 'string') {
    throw createError({ statusCode: 400, statusMessage: `${field} must be a string` })
  }
  return value
}

export default defineEventHandler(async (event) => {
  const employeeKey = getRouterParam(event, 'employeeKey')
  if (!employeeKey) {
    throw createError({ statusCode: 400, statusMessage: 'employeeKey is required' })
  }

  const employee = await getOdooEmployeeByKey(employeeKey)
  if (!employee) {
    throw createError({ statusCode: 404, statusMessage: 'Employee not found' })
  }

  const body = (await readBody(event)) as Record<string, unknown> | null
  const rawNote = requireString(body?.note, 'note')
  const note = rawNote.trim()

  if (note === '') {
    const existing = await prisma.cPlayerNote.findUnique({ where: { employeeKey } })
    if (existing) await prisma.cPlayerNote.delete({ where: { employeeKey } })
    return { note: '' }
  }

  await prisma.cPlayerNote.upsert({
    where: { employeeKey },
    create: { employeeKey, note },
    update: { note }
  })
  return { note }
})

