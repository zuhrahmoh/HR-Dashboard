import { createError, getRouterParam } from 'h3'
import { listEmployeeAttachments } from '../../../../utils/odooAttachments'

export default defineEventHandler(async (event) => {
  const employeeKey = getRouterParam(event, 'employeeKey')
  if (!employeeKey) {
    throw createError({ statusCode: 400, statusMessage: 'employeeKey is required' })
  }

  return await listEmployeeAttachments(employeeKey)
})

