import { createError, getRouterParam } from 'h3'
import { readJsonArray, writeJsonArray } from '../../utils/jsonStore'

type ContractChange = {
  id: string
  createdAt: string
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

  const items = await readJsonArray<ContractChange>('contract-changes.json')
  const idx = items.findIndex((v) => v.id === id)
  if (idx === -1) throw createError({ statusCode: 404, statusMessage: 'Contract change not found' })

  items.splice(idx, 1)
  await writeJsonArray('contract-changes.json', items)
  return { ok: true }
})

