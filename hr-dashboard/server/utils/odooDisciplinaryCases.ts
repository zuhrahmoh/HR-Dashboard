import { createError } from 'h3'
import type { Employee } from './employees'
import { getDisciplinaryIncludeMap } from './disciplinaryCaseInclude'
import { getOdooClient } from './odoo'
import { loadEmployeesFromOdoo } from './odooEmployees'

type FieldDef = { type?: string; string?: string; selection?: [string, string][]; relation?: string }

export type OdooDisciplinaryCaseRow = {
  id: string
  employeeName: string
  department?: string
  country?: string
  summary: string
  status: string
  includeInReport: boolean
  createdAt: string
}

function safeString(v: unknown) {
  if (v === true || v === false) return ''
  return typeof v === 'string' ? v : v == null ? '' : String(v)
}

function many2oneName(v: unknown) {
  if (Array.isArray(v) && typeof v[1] === 'string') return v[1]
  return ''
}

function selectionDisplayString(v: unknown): string {
  if (Array.isArray(v) && v.length >= 2 && typeof v[1] === 'string') return v[1].trim()
  return safeString(v).trim()
}

function selectionStoredKey(v: unknown): string {
  if (Array.isArray(v) && typeof v[0] === 'string') return v[0]
  if (typeof v === 'string') return v
  return safeString(v).trim()
}

function mapSelectionToLabel(def: FieldDef | undefined, raw: unknown): string {
  const key = selectionStoredKey(raw)
  const opts = def?.selection
  if (Array.isArray(opts) && key) {
    const hit = opts.find((p) => p[0] === key)
    if (hit) return hit[1].trim()
  }
  const disp = selectionDisplayString(raw)
  return (disp || key).trim()
}

function toIsoFromOdooDatetime(raw: unknown): string {
  const s = safeString(raw).trim()
  if (!s) return new Date(0).toISOString()
  const normalized = s.includes('T') ? s : s.replace(' ', 'T')
  const d = new Date(normalized)
  if (!Number.isNaN(d.getTime())) return d.toISOString()
  return new Date(0).toISOString()
}

function employeeIdFromKey(employeeKey: string): number | null {
  const m = /^odoo-(\d+)$/.exec(employeeKey.trim())
  if (!m) return null
  const n = Number(m[1])
  return Number.isFinite(n) ? n : null
}

function buildEmployeeIndex(employees: Employee[]) {
  const byOdooId = new Map<number, Employee>()
  for (const e of employees) {
    const id = employeeIdFromKey(e.employeeKey)
    if (id != null) byOdooId.set(id, e)
  }
  return byOdooId
}

function asEmployeeId(raw: unknown): number | null {
  if (Array.isArray(raw) && typeof raw[0] === 'number' && Number.isFinite(raw[0])) return raw[0]
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  return null
}

async function fieldsGetFull(model: string) {
  const client = await getOdooClient()
  return await client.executeKw<Record<string, FieldDef>>(model, 'fields_get', [], {
    attributes: ['string', 'type', 'selection', 'relation']
  })
}

function pickExistingFields(info: Record<string, FieldDef>, names: string[]) {
  return names.filter((n) => Object.prototype.hasOwnProperty.call(info, n))
}

function getDisciplineLineModel(): string {
  const runtimeConfig = useRuntimeConfig()
  const odoo = (runtimeConfig as { odoo?: Record<string, unknown> }).odoo ?? {}
  const m = String(odoo.disciplineCaseLineModel ?? 'hr.discipline.case').trim()
  return m || 'hr.discipline.case'
}

function resolveEmployeeField(info: Record<string, FieldDef>): string {
  if (info.employee_id) return 'employee_id'
  const hit = Object.keys(info).find((k) => info[k]?.relation === 'hr.employee')
  return hit || 'employee_id'
}

function mapDisciplineRowsToOutput(
  rows: Record<string, unknown>[],
  fieldInfo: Record<string, FieldDef>,
  employeeField: string,
  byOdooId: Map<number, Employee>
): OdooDisciplinaryCaseRow[] {
  const statusDef = fieldInfo.status
  const out: OdooDisciplinaryCaseRow[] = []
  for (const r of rows) {
    const lineId = r?.id
    if (typeof lineId !== 'number' || !Number.isFinite(lineId)) continue
    const empId = asEmployeeId(r[employeeField])
    const emp = empId != null ? byOdooId.get(empId) : undefined
    const id = `odoo-dc-${lineId}`

    out.push({
      id,
      employeeName: (emp?.name ?? '').trim() || many2oneName(r[employeeField]) || 'Unknown employee',
      department: emp?.department,
      country: emp?.countryAssigned,
      summary: safeString(r.case_summary).trim() || '—',
      status: fieldInfo.status ? mapSelectionToLabel(statusDef, r.status) : safeString(r.status).trim() || '—',
      includeInReport: false,
      createdAt: toIsoFromOdooDatetime(r.create_date ?? r.date_created)
    })
  }
  return out
}

export async function loadOdooDisciplinaryCases(): Promise<OdooDisciplinaryCaseRow[]> {
  const lineModel = getDisciplineLineModel()
  const employees = await loadEmployeesFromOdoo({ includeInactive: true })
  const byOdooId = buildEmployeeIndex(employees)
  const employeeIds = Array.from(byOdooId.keys())
  if (!employeeIds.length) return []

  const fieldInfo = await fieldsGetFull(lineModel)
  const employeeField = resolveEmployeeField(fieldInfo)

  const candidateFields = ['id', employeeField, 'case_summary', 'status', 'date_created', 'create_date', 'write_date']

  let fields = pickExistingFields(fieldInfo, candidateFields)
  if (!fields.includes('id')) fields = ['id', ...fields]
  if (!fields.includes(employeeField) && fieldInfo[employeeField]) fields = [...fields, employeeField]

  const domain: unknown[] = [[employeeField, 'in', employeeIds]]
  const client = await getOdooClient()
  const rows = await client.executeKw<Record<string, unknown>[]>(lineModel, 'search_read', [domain], {
    fields,
    order: 'create_date desc'
  })
  if (!Array.isArray(rows)) {
    throw createError({ statusCode: 502, statusMessage: 'Unexpected Odoo response for discipline cases.' })
  }

  const out = mapDisciplineRowsToOutput(rows, fieldInfo, employeeField, byOdooId)

  const flagMap = await getDisciplinaryIncludeMap(out.map((row) => row.id))
  return out.map((row) => ({ ...row, includeInReport: flagMap.get(row.id) ?? false }))
}

export async function loadOdooDisciplinaryCasesForEmployeeKey(employeeKey: string): Promise<OdooDisciplinaryCaseRow[]> {
  const odooId = employeeIdFromKey(employeeKey)
  if (odooId == null) return []

  const lineModel = getDisciplineLineModel()
  const employees = await loadEmployeesFromOdoo()
  const byOdooId = buildEmployeeIndex(employees)

  const fieldInfo = await fieldsGetFull(lineModel)
  const employeeField = resolveEmployeeField(fieldInfo)

  const candidateFields = ['id', employeeField, 'case_summary', 'status', 'date_created', 'create_date', 'write_date']

  let fields = pickExistingFields(fieldInfo, candidateFields)
  if (!fields.includes('id')) fields = ['id', ...fields]
  if (!fields.includes(employeeField) && fieldInfo[employeeField]) fields = [...fields, employeeField]

  const domain: unknown[] = [[employeeField, '=', odooId]]
  const client = await getOdooClient()
  const rows = await client.executeKw<Record<string, unknown>[]>(lineModel, 'search_read', [domain], {
    fields,
    order: 'create_date desc'
  })
  if (!Array.isArray(rows)) {
    throw createError({ statusCode: 502, statusMessage: 'Unexpected Odoo response for discipline cases.' })
  }

  const out = mapDisciplineRowsToOutput(rows, fieldInfo, employeeField, byOdooId)
  const flagMap = await getDisciplinaryIncludeMap(out.map((row) => row.id))
  return out.map((row) => ({ ...row, includeInReport: flagMap.get(row.id) ?? false }))
}

export function parseOdooDisciplineCaseId(id: string): number | null {
  const m = /^odoo-dc-(\d+)$/.exec(String(id).trim())
  if (!m) return null
  const n = Number(m[1])
  return Number.isFinite(n) ? n : null
}
