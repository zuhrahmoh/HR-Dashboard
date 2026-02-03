import { loadEmployeesFromCsv } from '../utils/employees'

export default defineEventHandler(async () => {
  return await loadEmployeesFromCsv()
})

