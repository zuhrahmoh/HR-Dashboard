import { getQuery } from 'h3'
import { createError } from 'h3'
import { getOdooClient } from '../../../utils/odoo'

function pickExisting(fields: Record<string, unknown>, candidates: string[]) {
  return candidates.filter((k) => Object.prototype.hasOwnProperty.call(fields, k))
}

function asId(v: unknown): number | null {
  if (Number.isFinite(v)) return Number(v)
  if (Array.isArray(v) && Number.isFinite(v[0])) return Number(v[0])
  return null
}

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const employeeKey = typeof q.employeeKey === 'string' ? q.employeeKey.trim() : ''
  const m = /^odoo-(\d+)$/.exec(employeeKey)
  const employeeId = m ? Number(m[1]) : null
  if (!employeeId || !Number.isFinite(employeeId)) {
    throw createError({ statusCode: 400, statusMessage: 'Provide ?employeeKey=odoo-<id>' })
  }

  const client = await getOdooClient()
  const empFieldsInfo = await client.fieldsGet('hr.employee')
  const contractFieldsInfo = await client.fieldsGet('hr.contract').catch(() => ({}))

  const employeeFields = pickExisting(empFieldsInfo, [
    'name',
    'active',
    'employee_type',
    'employment_type',
    'contract_id',
    'contract_ids',
    'contract_start',
    'contract_end',
    'end_contract_date',
    'end_contract_due_date',
    'end_contract_notification',
    'end_of_probation',
    'probation_end_date',
    'trial_date_end'
  ])

  const [emp] = await client.executeKw<any[]>(
    'hr.employee',
    'search_read',
    [[['id', '=', employeeId]]],
    { fields: ['id', ...employeeFields] }
  )

  const contractId = asId(emp?.contract_id)
  const contractIds = Array.isArray(emp?.contract_ids) ? emp.contract_ids.filter((x: unknown) => Number.isFinite(x)) : []
  const allContractIds = Array.from(new Set([contractId, ...contractIds].filter((x): x is number => Number.isFinite(x))))

  const contractFields = pickExisting(contractFieldsInfo, ['name', 'state', 'date_start', 'date_end', 'trial_date_end'])
  const contracts =
    allContractIds.length > 0 && contractFields.length > 0
      ? await client.executeKw<any[]>(
          'hr.contract',
          'search_read',
          [[['id', 'in', allContractIds]]],
          { fields: ['id', ...contractFields] }
        )
      : []

  return {
    employeeKey,
    employeeId,
    employee: emp ?? null,
    contractIds: allContractIds,
    contracts
  }
})

