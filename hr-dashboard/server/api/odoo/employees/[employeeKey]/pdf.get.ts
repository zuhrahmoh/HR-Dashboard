import { createError, getRouterParam, setHeader } from 'h3'
import { getOdooEmployeeByKey } from '../../../../utils/odooEmployees'
import { buildProfilePdfCardLayout, loadLogo, type ProfileCardInput } from '../../../../utils/profilePdf'

function dashify(value: unknown): string {
  const s = String(value ?? '').trim()
  return s ? s : '—'
}

function capitalizeFirst(value: unknown): string {
  const s = dashify(value)
  if (s === '—') return s
  return s[0]!.toUpperCase() + s.slice(1)
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

  const generatedAtIso = new Date().toISOString()
  const logo = await loadLogo()

  const input: ProfileCardInput = {
    title: 'Employee Profile',
    subtitle: dashify(employee.position || employee.name),
    logo,
    generatedAtIso,
    primary: {
      initials: '—',
      name: dashify(employee.name),
      position: dashify(employee.position),
      employeeStatus: dashify(employee.employeeStatus),
      employeeType: capitalizeFirst(employee.employeeType),
      department: dashify(employee.department),
      countryAssigned: dashify(employee.countryAssigned),
      reportingTo: dashify(employee.reportingTo)
    },
    contact: {
      workEmail: dashify(employee.workEmail),
      workPhone: dashify(employee.workPhone),
      personalPhone: dashify(employee.personalPhone)
    },
    employment: {
      startDate: dashify(employee.startDate),
      tenure: dashify(employee.tenure),
      contractOrProbationEnd: dashify(employee.contractOrProbationEndDate),
      gender: dashify(employee.gender),
      employeeKey: dashify(employee.employeeKey)
    },
    talent: { talentRating: dashify(employee.talentRating) }
  }

  const pdf = buildProfilePdfCardLayout(input)

  setHeader(event, 'content-type', 'application/pdf')
  setHeader(event, 'content-disposition', `attachment; filename="employee-${employeeKey}.pdf"`)
  return pdf
})

