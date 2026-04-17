import { prisma } from '../utils/db'
import { EXIT_TASK_COUNT } from '~/utils/recruitmentChecklistTasks'

function normalizeTaskStates(value: unknown): boolean[] | null {
  if (!Array.isArray(value)) return null
  const out = new Array(EXIT_TASK_COUNT).fill(false) as boolean[]
  for (let i = 0; i < EXIT_TASK_COUNT; i += 1) out[i] = Boolean(value[i])
  return out
}

export default defineEventHandler(async () => {
  const rows = await prisma.recruitmentExitChecklist.findMany({
    select: { rowKey: true, taskStates: true }
  })
  const checklists: Record<string, boolean[]> = {}
  for (const r of rows) {
    const arr = normalizeTaskStates(r.taskStates)
    if (arr) checklists[r.rowKey] = arr
  }
  return { checklists }
})
