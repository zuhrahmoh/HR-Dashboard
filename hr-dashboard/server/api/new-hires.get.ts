import { readJsonArray } from '../utils/jsonStore'

type NewHire = {
  id: string
  name: string
  position: string
  country: string
  startDate: string
  status: string
  createdAt: string
}

export default defineEventHandler(async () => {
  const items = await readJsonArray<NewHire>('new-hires.json')
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
})

