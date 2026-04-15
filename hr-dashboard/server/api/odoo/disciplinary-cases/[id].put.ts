import { createError, readBody } from 'h3'
import { setDisciplinaryIncludeFlag } from '../../../utils/disciplinaryCaseInclude'
import { parseOdooDisciplineCaseId } from '../../../utils/odooDisciplinaryCases'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing case id' })
  }
  const body = await readBody(event).catch(() => null)
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid JSON body' })
  }
  const keys = Object.keys(body as Record<string, unknown>)
  if (keys.length !== 1 || keys[0] !== 'includeInReport') {
    throw createError({ statusCode: 400, statusMessage: 'Only includeInReport may be updated' })
  }
  const includeInReport = (body as { includeInReport?: unknown }).includeInReport
  if (typeof includeInReport !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: 'includeInReport must be a boolean' })
  }
  const odooKey = decodeURIComponent(id).trim()
  if (parseOdooDisciplineCaseId(odooKey) == null) {
    throw createError({ statusCode: 404, statusMessage: 'Case not found' })
  }
  await setDisciplinaryIncludeFlag(odooKey, includeInReport)
  return { ok: true as const, id: odooKey, includeInReport }
})
