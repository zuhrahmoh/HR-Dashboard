import { createError, getRouterParam, setHeader } from 'h3'
import { getOdooEmployeeByKey } from '../../../../utils/odooEmployees'
import { loadOdooDisciplinaryCasesForEmployeeKey } from '../../../../utils/odooDisciplinaryCases'
import { getCompensationForEmployeeName } from '../../../../utils/sharepointCompensation'
import { renderEmployeeProfilePdf } from '../../../../utils/employeeProfilePrintHtml'

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

  const runtimeConfig = useRuntimeConfig()
  const tenantId = runtimeConfig.graph?.tenantId || ''
  const clientId = runtimeConfig.graph?.clientId || ''
  const clientSecret = runtimeConfig.graph?.clientSecret || ''
  const hostname = runtimeConfig.sharepoint?.hostname || ''
  const siteId = (runtimeConfig as any).sharepointSalary?.siteId || ''
  const listId = (runtimeConfig as any).sharepointSalary?.listId || ''
  const cacheTtlMs = (runtimeConfig as any).sharepointSalary?.cacheTtlMs as number | undefined

  const name = employee.name?.trim() || ''
  let compensation = null as Awaited<ReturnType<typeof getCompensationForEmployeeName>>
  if (tenantId && clientId && clientSecret && hostname && siteId && listId && name) {
    compensation = await getCompensationForEmployeeName({
      tenantId,
      clientId,
      clientSecret,
      hostname,
      siteId,
      listId,
      cacheTtlMs,
      name
    })
  }

  const disciplinaryCases = await loadOdooDisciplinaryCasesForEmployeeKey(employeeKey)

  const pdf = await renderEmployeeProfilePdf({
    employee,
    compensation,
    disciplinaryCases,
    generatedAtIso
  })

  setHeader(event, 'content-type', 'application/pdf')
  setHeader(event, 'content-disposition', `attachment; filename="employee-${employeeKey}.pdf"`)
  setHeader(event, 'cache-control', 'no-store')
  return pdf
})
