import { createError, getRouterParam } from 'h3'
import { readJsonArray, writeJsonArray } from '../../utils/jsonStore'

type EapReferral = {
  id: string
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'id is required' })

  const items = await readJsonArray<EapReferral>('eap-referrals.json')
  const idx = items.findIndex((v) => v.id === id)
  if (idx === -1) throw createError({ statusCode: 404, statusMessage: 'EAP referral not found' })

  items.splice(idx, 1)
  await writeJsonArray('eap-referrals.json', items)
  return { ok: true }
})

