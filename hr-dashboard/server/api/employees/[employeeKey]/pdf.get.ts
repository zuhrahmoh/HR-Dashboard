import { createError, getRouterParam, setHeader } from 'h3'
import { getEmployeeByKey } from '../../../utils/employees'
import { buildProfilePdf, loadLogo } from '../../../utils/profilePdf'

export default defineEventHandler(async (event) => {
  const employeeKey = getRouterParam(event, 'employeeKey')
  if (!employeeKey) {
    throw createError({ statusCode: 400, statusMessage: 'employeeKey is required' })
  }

  const employee = await getEmployeeByKey(employeeKey)
  if (!employee) {
    throw createError({ statusCode: 404, statusMessage: 'Employee not found' })
  }

  const generatedAtIso = new Date().toISOString()
  const logo = await loadLogo()
  const pdf = buildProfilePdf({
    title: 'Employee Profile',
    subtitle: employee.name || '—',
    logo,
    generatedAtIso,
    sections: [
      {
        title: 'Personal',
        rows: [
          { label: 'Name', value: employee.name || '—' },
          { label: 'Gender', value: employee.gender || '—' }
        ]
      },
      {
        title: 'Organization',
        rows: [
          { label: 'Department', value: employee.department || '—' },
          { label: 'Position', value: employee.position || '—' },
          { label: 'Reporting To', value: employee.reportingTo || '—' },
          { label: 'Country Assigned', value: employee.countryAssigned || '—' }
        ]
      },
      {
        title: 'Employment',
        rows: [
          { label: 'Employee Key', value: employee.employeeKey },
          { label: 'Status', value: employee.employeeStatus || '—' },
          { label: 'Start Date', value: employee.startDate || '—' },
          { label: 'Contract/Prob. End', value: employee.contractOrProbationEndDate || '—' },
          { label: 'Employee Type', value: employee.employeeType || '—' },
          { label: 'Employment Status', value: employee.employmentStatus || '—' }
        ]
      },
      {
        title: 'Compensation',
        rows: [
          { label: 'Monthly Salary', value: employee.monthlySalary || '—' },
          { label: 'Allowances', value: employee.allowances || '—' },
          { label: 'Gross Salary', value: employee.grossSalary || '—' },
          { label: 'Type of Allowance', value: employee.typeOfAllowance || '—' }
        ]
      }
    ]
  })

  setHeader(event, 'content-type', 'application/pdf')
  setHeader(event, 'content-disposition', `attachment; filename="employee-${employeeKey}.pdf"`)
  return pdf
})

