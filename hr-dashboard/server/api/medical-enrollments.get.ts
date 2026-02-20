import { readJsonArray } from '../utils/jsonStore'

type MedicalEnrollment = {
  id: string
  employeeName: string
  country: string
  enrollmentType?: string
  vendor?: string
  stage: string
  dateInitiated?: string
  nextAction?: string
  hrRepresentative?: string
  notes?: string
  attachmentsUrl?: string
  createdAt: string
  updatedAt: string
}

export default defineEventHandler(async () => {
  const items = await readJsonArray<MedicalEnrollment>('medical-enrollments.json')
  return items.sort((a, b) => (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt))
})

