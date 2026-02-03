import { createError, getRouterParam } from 'h3'
import { readJsonArray, writeJsonArray } from '../../utils/jsonStore'

type NewHire = {
  id: string
  name: string
  position: string
  country: string
  startDate: string
  status: string
  createdAt: string
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

  const items = await readJsonArray<NewHire>('new-hires.json')
  const idx = items.findIndex((v) => v.id === id)
  if (idx === -1) throw createError({ statusCode: 404, statusMessage: 'New hire not found' })

  items.splice(idx, 1)
  await writeJsonArray('new-hires.json', items)
  return { ok: true }
})

