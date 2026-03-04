import { createError, getRouterParam } from 'h3'
import { prisma } from '../../utils/db'
import { getOdooEmployeeByKey } from '../../utils/odooEmployees'

type CPlayerNote = {
  employeeKey: string
  note: string
  updatedAt: string
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

  const record = await prisma.cPlayerNote.findUnique({ where: { employeeKey } })

  return { note: record?.note ?? '' }
})

