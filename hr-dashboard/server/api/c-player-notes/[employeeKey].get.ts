import { createError, getRouterParam } from 'h3'
import { getEmployeeByKey } from '../../utils/employees'
import { readJsonArray } from '../../utils/jsonStore'

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
    throw createError({ statusCode: 400, statusMessage: 'Notes are not available for resigned employees' })
  }

  if (!isCPlayer(employee.talentRating)) {
    throw createError({ statusCode: 400, statusMessage: 'Notes are only available for C Players' })
  }

  const notes = await readJsonArray<CPlayerNote>('c-player-notes.json')
  const record = notes.find((n) => n.employeeKey === employeeKey) ?? null

  return { note: record?.note ?? '' }
})

