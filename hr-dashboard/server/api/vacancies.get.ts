import { readJsonArray } from '../utils/jsonStore'

type Vacancy = {
  id: string
  positionTitle: string
  department: string
  country: string
  priority: string
  createdAt: string
}

export default defineEventHandler(async () => {
  const items = await readJsonArray<Vacancy>('vacancies.json')
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
})

