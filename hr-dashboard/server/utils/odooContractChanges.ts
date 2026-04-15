import { createError } from 'h3'
import type { Employee } from './employees'
import { getOdooClient } from './odoo'
import { loadEmployeesFromOdoo } from './odooEmployees'

type FieldDef = { type?: string; string?: string; selection?: [string, string][]; relation?: string }

export type OdooContractChangeRow = {
  id: string
  employeeName: string
  country?: string
  department: string
  position: string
  changeTypes: string[]
  status?: string
  description: string
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

function getOdooContractChangeConfig() {
  const runtimeConfig = useRuntimeConfig()
  const odoo = (runtimeConfig as { odoo?: Record<string, unknown> }).odoo ?? {}
  return {
    lineModel: String(odoo.contractChangeLineModel ?? '').trim(),
    employeeField: String(odoo.contractChangeEmployeeField ?? 'employee_id').trim() || 'employee_id',
    typeField: String(odoo.contractChangeTypeField ?? '').trim(),
    statusField: String(odoo.contractChangeStatusField ?? '').trim(),
    descriptionField: String(odoo.contractChangeDescriptionField ?? '').trim()
  }
}

async function fieldsGetFull(model: string) {
  const client = await getOdooClient()
  return await client.executeKw<Record<string, FieldDef>>(model, 'fields_get', [], {
    attributes: ['string', 'type', 'selection', 'relation']
  })
}

function labelOf(def: FieldDef | undefined) {
  return (def?.string ?? '').trim().toLowerCase()
}

function resolveEmployeeField(info: Record<string, FieldDef>, explicit: string): string {
  if (explicit && info[explicit]) return explicit
  for (const [name, def] of Object.entries(info)) {
    if ((def.type ?? '').toLowerCase() !== 'many2one') continue
    if ((def.relation ?? '').trim() === 'hr.employee') return name
  }
  throw createError({
    statusCode: 500,
    statusMessage:
      'Could not find a many2one field on the contract change line model pointing to hr.employee. Set ODOO_CONTRACT_CHANGE_EMPLOYEE_FIELD.'
  })
}

function resolveTypeField(info: Record<string, FieldDef>, explicit: string): string {
  if (explicit && info[explicit]) return explicit
  for (const [name, def] of Object.entries(info)) {
    const l = labelOf(def)
    if (l === 'contract change type') return name
  }
  for (const [name, def] of Object.entries(info)) {
    const l = labelOf(def)
    if (l.includes('contract') && l.includes('change') && l.includes('type')) return name
  }
  for (const [name, def] of Object.entries(info)) {
    const l = labelOf(def)
    if (l.includes('change') && l.includes('type')) return name
  }
  throw createError({
    statusCode: 500,
    statusMessage:
      'Could not resolve the Contract Change Type field on the Odoo line model. Set ODOO_CONTRACT_CHANGE_TYPE_FIELD.'
  })
}

function resolveStatusField(info: Record<string, FieldDef>, explicit: string): string | null {
  if (explicit && info[explicit]) return explicit
  for (const [name, def] of Object.entries(info)) {
    if (labelOf(def) === 'status') return name
  }
  for (const [name, def] of Object.entries(info)) {
    const l = labelOf(def)
    if (l.includes('status') && (def.type ?? '').toLowerCase() === 'selection') return name
  }
  return null
}

function resolveDescriptionField(info: Record<string, FieldDef>, explicit: string): string {
  if (explicit && info[explicit]) return explicit
  for (const [name, def] of Object.entries(info)) {
    const l = labelOf(def)
    if (l.includes('description') && l.includes('change')) return name
  }
  for (const [name, def] of Object.entries(info)) {
    if (labelOf(def) === 'description of change') return name
  }
  if (info.description) return 'description'
  throw createError({
    statusCode: 500,
    statusMessage:
      'Could not resolve the Description of Change field on the Odoo line model. Set ODOO_CONTRACT_CHANGE_DESCRIPTION_FIELD.'
  })
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

function relationalListIdsAndTupleNames(raw: unknown): { ids: number[]; tupleNamesById: Map<number, string> } {
  const ids: number[] = []
  const tupleNamesById = new Map<number, string>()
  if (!Array.isArray(raw)) return { ids, tupleNamesById }
  for (const el of raw) {
    if (typeof el === 'number' && Number.isFinite(el)) {
      ids.push(el)
      continue
    }
    if (Array.isArray(el) && el.length >= 2 && typeof el[0] === 'number' && Number.isFinite(el[0]) && typeof el[1] === 'string') {
      const id = el[0]
      const nm = el[1].trim()
      ids.push(id)
      if (nm) tupleNamesById.set(id, nm)
    }
  }
  return { ids, tupleNamesById }
}

async function fetchIdToDisplayName(
  client: Awaited<ReturnType<typeof getOdooClient>>,
  comodel: string,
  ids: number[]
): Promise<Map<number, string>> {
  const map = new Map<number, string>()
  const unique = [...new Set(ids)].filter((x) => Number.isFinite(x) && x > 0)
  if (!unique.length || !comodel.trim()) return map

  const rows = await client.executeKw<Array<Record<string, unknown>>>(comodel.trim(), 'read', [unique], {
    fields: ['id', 'name']
  })
  if (!Array.isArray(rows)) return map
  for (const rec of rows) {
    const id = rec?.id
    if (!Number.isFinite(id)) continue
    const name = safeString(rec?.name).trim()
    map.set(Number(id), name || `#${id}`)
  }
  return map
}

function displayChangeTypes(
  fieldDef: FieldDef | undefined,
  fieldType: string,
  raw: unknown,
  idToName: Map<number, string> | null
): string[] {
  const t = fieldType.toLowerCase()
  if (t === 'selection') {
    const label = mapSelectionToLabel(fieldDef, raw)
    return label ? [label] : []
  }
  if ((t === 'many2many' || t === 'one2many') && idToName) {
    const { ids, tupleNamesById } = relationalListIdsAndTupleNames(raw)
    return ids.map((id) => tupleNamesById.get(id) ?? idToName.get(id) ?? String(id)).filter(Boolean)
  }
  const s = (many2oneName(raw) || safeString(raw)).trim()
  if (!s) return []
  if (s.includes(',')) {
    return s
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
  }
  return [s]
}

export async function loadOdooContractChanges(): Promise<OdooContractChangeRow[]> {
  const cfg = getOdooContractChangeConfig()
  if (!cfg.lineModel) {
    throw createError({
      statusCode: 503,
      statusMessage:
        'Contract changes are not configured. Set ODOO_CONTRACT_CHANGE_LINE_MODEL to the Odoo technical model name of the contract change lines.'
    })
  }

  const employees = await loadEmployeesFromOdoo({ includeInactive: true })
  const byOdooId = buildEmployeeIndex(employees)
  const employeeIds = Array.from(byOdooId.keys())
  if (!employeeIds.length) return []

  const fieldInfo = await fieldsGetFull(cfg.lineModel)
  const employeeField = resolveEmployeeField(fieldInfo, cfg.employeeField)
  const typeField = resolveTypeField(fieldInfo, cfg.typeField)
  const statusField = resolveStatusField(fieldInfo, cfg.statusField)
  const descriptionField = resolveDescriptionField(fieldInfo, cfg.descriptionField)

  const typeDef = fieldInfo[typeField]
  const statusDef = statusField ? fieldInfo[statusField] : undefined

  const fields = Array.from(
    new Set(['id', employeeField, typeField, descriptionField, 'create_date', statusField].filter(Boolean) as string[])
  )

  const domain: unknown[] = [[employeeField, 'in', employeeIds]]
  const client = await getOdooClient()
  const rows = await client.executeKw<Record<string, unknown>[]>(cfg.lineModel, 'search_read', [domain], {
    fields,
    order: 'create_date desc'
  })
  if (!Array.isArray(rows)) {
    throw createError({ statusCode: 502, statusMessage: 'Unexpected Odoo response for contract change lines.' })
  }

  const typeT = (typeDef?.type ?? '').toLowerCase()
  const typeComodel = (typeDef?.relation ?? '').trim()
  let changeTypeIdToName: Map<number, string> | null = null
  if ((typeT === 'many2many' || typeT === 'one2many') && typeComodel) {
    const allIds: number[] = []
    for (const r of rows) {
      allIds.push(...relationalListIdsAndTupleNames(r[typeField]).ids)
    }
    changeTypeIdToName = await fetchIdToDisplayName(client, typeComodel, allIds)
  }

  const out: OdooContractChangeRow[] = []
  for (const r of rows) {
    const lineId = r?.id
    if (!Number.isFinite(lineId)) continue
    const empId = asEmployeeId(r[employeeField])
    const emp = empId != null ? byOdooId.get(empId) : undefined
    const typeRaw = r[typeField]
    const changeTypes = displayChangeTypes(typeDef, typeDef?.type ?? 'char', typeRaw, changeTypeIdToName)
    const statusRaw = statusField ? r[statusField] : undefined
    const statusLabel = statusField && statusDef ? mapSelectionToLabel(statusDef, statusRaw) : selectionDisplayString(statusRaw)

    out.push({
      id: `odoo-cc-${lineId}`,
      employeeName: (emp?.name ?? '').trim() || many2oneName(r[employeeField]) || 'Unknown employee',
      country: emp?.countryAssigned,
      department: emp?.department ?? '',
      position: emp?.position ?? '',
      changeTypes,
      status: statusLabel || undefined,
      description: safeString(r[descriptionField]).trim(),
      createdAt: toIsoFromOdooDatetime(r.create_date)
    })
  }

  return out
}
