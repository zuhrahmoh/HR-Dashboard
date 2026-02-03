import { createError, getRouterParam } from 'h3'
import { readJsonArray, writeJsonArray } from '../../utils/jsonStore'

type DisciplinaryCase = {
  id: string
  employeeName: string
  caseType: string
  summary: string
  status: string
  createdAt: string
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

  const items = await readJsonArray<DisciplinaryCase>('disciplinary-cases.json')
  const idx = items.findIndex((v) => v.id === id)
  if (idx === -1) throw createError({ statusCode: 404, statusMessage: 'Disciplinary case not found' })

  items.splice(idx, 1)
  await writeJsonArray('disciplinary-cases.json', items)
  return { ok: true }
})

