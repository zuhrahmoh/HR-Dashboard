import { createError, getRouterParam, setHeader } from 'h3'
import { getOdooEmployeeByKey } from '../../../../utils/odooEmployees'
import { buildProfilePdfCardLayout, loadLogo, type ProfileCardInput } from '../../../../utils/profilePdf'

function initials(name: string | undefined): string {
  const s = (name ?? '').trim()
  if (!s) return '—'
  const parts = s.split(/\s+/g).filter(Boolean)
  const a = parts[0]?.[0] ?? ''
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : ''
  return (a + b).toUpperCase() || '—'
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
    title: 'Employee Profile (Odoo)',
    subtitle: employee.name || '—',
    logo,
    generatedAtIso,
    primary: {
      initials: initials(employee.name),
      name: employee.name || '—',
      position: employee.position || '—',
      employeeStatus: employee.employeeStatus || '—',
      employeeType: employee.employeeType || '—',
      department: employee.department || '—',
      countryAssigned: employee.countryAssigned || '—',
      reportingTo: employee.reportingTo ?? '—'
    },
    contact: {
      workEmail: employee.workEmail ?? '—',
      workPhone: employee.workPhone ?? '—',
      personalPhone: employee.personalPhone ?? '—'
    },
    employment: {
      startDate: employee.startDate ?? '—',
      tenure: employee.tenure ?? '—',
      contractOrProbationEnd: employee.contractOrProbationEndDate ?? '—',
      gender: employee.gender ?? '—',
      employeeKey: employee.employeeKey
    },
    talent: { talentRating: employee.talentRating ?? '—' }
  }

  const pdf = buildProfilePdfCardLayout(input)

  setHeader(event, 'content-type', 'application/pdf')
  setHeader(event, 'content-disposition', `attachment; filename="employee-${employeeKey}.pdf"`)
  return pdf
})

