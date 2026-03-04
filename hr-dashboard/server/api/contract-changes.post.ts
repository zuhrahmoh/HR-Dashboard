import { randomUUID } from 'node:crypto'
import { createError, readBody } from 'h3'
import { prisma } from '../utils/db'

const CHANGE_TYPES = ['Salary', 'Role', 'Reporting', 'Job Title', 'Contract Extension', 'Non-Renewal'] as const
type ChangeType = (typeof CHANGE_TYPES)[number]
const STATUSES = ['Approval required', 'Approved', 'On Hold'] as const
type Status = (typeof STATUSES)[number]

type ContractChange = {
  id: string
  employeeName: string
  country: string
  department: string
  position: string
  changeTypes: ChangeType[]
  status: Status
  description: string
  createdAt: string
}

function requireNonEmptyString(value: unknown, field: string) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw createError({ statusCode: 400, statusMessage: `${field} is required` })
  }
  return value.trim()
}

function requireChangeTypes(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'changeTypes is required' })
  }

  const raw = value
    .flatMap((v) => {
      const s = typeof v === 'string' ? v.trim() : ''
      if (!s) return []
      if (s === 'Role, Reporting') return ['Role', 'Reporting']
      return [s]
    })
    .filter(Boolean)

  const allowed = new Set<string>(CHANGE_TYPES)
  for (const t of raw) {
    if (!allowed.has(t)) throw createError({ statusCode: 400, statusMessage: `Invalid change type: ${t}` })
  }

  const set = new Set<string>(raw)
  const ordered = CHANGE_TYPES.filter((t) => set.has(t))
  if (ordered.length === 0) throw createError({ statusCode: 400, statusMessage: 'changeTypes is required' })
  return ordered as ChangeType[]
}

function requireStatus(value: unknown) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw createError({ statusCode: 400, statusMessage: 'status is required' })
  }
  const v = value.trim()
  if (!(STATUSES as readonly string[]).includes(v)) {
    throw createError({ statusCode: 400, statusMessage: `Invalid status: ${v}` })
  }
  return v as Status
}

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as Record<string, unknown> | null

  const employeeName = requireNonEmptyString(body?.employeeName, 'employeeName')
  const country = requireNonEmptyString(body?.country, 'country')
  const department = requireNonEmptyString(body?.department, 'department')
  const position = requireNonEmptyString(body?.position, 'position')
  const changeTypes = requireChangeTypes(body?.changeTypes)
  const status = requireStatus(body?.status)
  const description = requireNonEmptyString(body?.description, 'description')

  const createdAt = new Date()
  const created = await prisma.contractChange.create({
    data: {
      id: randomUUID(),
      employeeName,
      country,
      department,
      position,
      changeTypes,
      status,
      description,
      createdAt
    }
  })

  return { ...created, createdAt: createdAt.toISOString() }
})

