import { readJsonArray } from '../utils/jsonStore'

type DisciplinaryCase = {
  id: string
  employeeName: string
  caseType: string
  summary: string
  status: string
  createdAt: string
}

export default defineEventHandler(async () => {
  const items = await readJsonArray<DisciplinaryCase>('disciplinary-cases.json')
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
})

