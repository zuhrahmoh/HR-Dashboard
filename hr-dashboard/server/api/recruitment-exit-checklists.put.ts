import { createError, readBody } from 'h3'
import { prisma } from '../utils/db'
import { EXIT_TASK_COUNT } from '~/utils/recruitmentChecklistTasks'

function normalizeTaskStates(value: unknown): boolean[] | null {
  if (!Array.isArray(value)) return null
  const out = new Array(EXIT_TASK_COUNT).fill(false) as boolean[]
  for (let i = 0; i < EXIT_TASK_COUNT; i += 1) out[i] = Boolean(value[i])
  return out
}

export default defineEventHandler(async (event) => {
  const body = (await readBody(event)) as Record<string, unknown> | null
  const rowKey = typeof body?.rowKey === 'string' ? body.rowKey.trim() : ''
  const normalized = normalizeTaskStates(body?.taskStates)
  if (!rowKey) throw createError({ statusCode: 400, statusMessage: 'rowKey is required' })
  if (!normalized) throw createError({ statusCode: 400, statusMessage: 'taskStates must be a boolean array' })

  await prisma.recruitmentExitChecklist.upsert({
    where: { rowKey },
    create: { rowKey, taskStates: normalized },
    update: { taskStates: normalized }
  })

  return { ok: true }
})
