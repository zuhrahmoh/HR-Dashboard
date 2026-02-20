import { readJsonArray } from '../utils/jsonStore'

type CriticalRecruitment = {
  id: string
  candidateName: string
  position: string
  country: string
  stage: string
  notes?: string
  createdAt: string
}

export default defineEventHandler(async () => {
  const items = await readJsonArray<CriticalRecruitment>('critical-recruitment.json')
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
})

