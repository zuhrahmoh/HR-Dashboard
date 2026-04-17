import { createError, getRouterParam } from 'h3'
import { loadOdooDisciplinaryCasesForEmployeeKey } from '../../../../utils/odooDisciplinaryCases'

export default defineEventHandler(async (event) => {
  const employeeKey = getRouterParam(event, 'employeeKey')
  if (!employeeKey) {
    throw createError({ statusCode: 400, statusMessage: 'employeeKey is required' })
  }

  return await loadOdooDisciplinaryCasesForEmployeeKey(employeeKey)
})
