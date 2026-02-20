import { createError, getRouterParam } from 'h3'
import { readJsonArray, writeJsonArray } from '../../utils/jsonStore'

type MedicalEnrollment = {
  id: string
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

  const items = await readJsonArray<MedicalEnrollment>('medical-enrollments.json')
  const idx = items.findIndex((v) => v.id === id)
  if (idx === -1) throw createError({ statusCode: 404, statusMessage: 'Medical enrollment not found' })

  items.splice(idx, 1)
  await writeJsonArray('medical-enrollments.json', items)
  return { ok: true }
})

