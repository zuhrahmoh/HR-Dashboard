import { loadEmployeesFromOdoo } from '../../utils/odooEmployees'

export default defineEventHandler(async () => {
  const employees = await loadEmployeesFromOdoo({ includeInactive: false })
  return employees
    .filter((e) => e.employeeStatus === 'Offboarding')
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
})
