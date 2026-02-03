import { createError, getRouterParam, readBody } from 'h3'
import { getEmployeeByKey } from '../../utils/employees'
import { readJsonArray, writeJsonArray } from '../../utils/jsonStore'

type CPlayerNote = {
  employeeKey: string
  note: string
  updatedAt: string
}

function isResigned(status: string) {
  return status.trim().toLowerCase() === 'resigned'
}

function isCPlayer(talentRating: string | undefined) {
  return (talentRating ?? '').trim() === 'C Player'
}

function requireString(value: unknown, field: string) {
  if (typeof value !== 'string') {
    throw createError({ statusCode: 400, statusMessage: `${field} must be a string` })
  }
  return value
}

export default defineEventHandler(async (event) => {
  const employeeKey = getRouterParam(event, 'employeeKey')
  if (!employeeKey) {
    throw createError({ statusCode: 400, statusMessage: 'employeeKey is required' })
  }

  const employee = await getEmployeeByKey(employeeKey)
  if (!employee) {
    throw createError({ statusCode: 404, statusMessage: 'Employee not found' })
  }

  if (isResigned(employee.employeeStatus ?? '')) {
    throw createError({ statusCode: 400, statusMessage: 'Notes cannot be saved for resigned employees' })
  }

  if (!isCPlayer(employee.talentRating)) {
    throw createError({ statusCode: 400, statusMessage: 'Notes can only be saved for C Players' })
  }

  const body = (await readBody(event)) as Record<string, unknown> | null
  const rawNote = requireString(body?.note, 'note')
  const note = rawNote.trim()

  const items = await readJsonArray<CPlayerNote>('c-player-notes.json')
  const idx = items.findIndex((n) => n.employeeKey === employeeKey)

  if (note === '') {
    if (idx !== -1) {
      items.splice(idx, 1)
      await writeJsonArray('c-player-notes.json', items)
    }
    return { note: '' }
  }

  const record: CPlayerNote = { employeeKey, note, updatedAt: new Date().toISOString() }
  if (idx === -1) items.push(record)
  else items[idx] = record

  await writeJsonArray('c-player-notes.json', items)
  return { note }
})

