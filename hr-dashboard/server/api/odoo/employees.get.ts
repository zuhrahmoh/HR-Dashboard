import { loadEmployeesFromOdoo } from '../../utils/odooEmployees'
import { getQuery } from 'h3'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const includeInactive = q.includeInactive === '1' || q.includeInactive === 'true'
  return await loadEmployeesFromOdoo({ includeInactive })
})

