import { createError, getRouterParam } from 'h3'
import { readJsonArray, writeJsonArray } from '../../utils/jsonStore'

type CriticalRecruitment = {
  id: string
  candidateName: string
  position: string
  country: string
  stage: string
  createdAt: string
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

  const items = await readJsonArray<CriticalRecruitment>('critical-recruitment.json')
  const idx = items.findIndex((v) => v.id === id)
  if (idx === -1) throw createError({ statusCode: 404, statusMessage: 'Critical recruitment item not found' })

  items.splice(idx, 1)
  await writeJsonArray('critical-recruitment.json', items)
  return { ok: true }
})

