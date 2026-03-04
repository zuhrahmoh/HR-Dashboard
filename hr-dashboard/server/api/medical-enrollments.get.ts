import { prisma } from '../utils/db'

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
  const items = await prisma.medicalEnrollment.findMany({ orderBy: { updatedAt: 'desc' } })
  return items.map((v) => ({
    ...v,
    createdAt: v.createdAt.toISOString(),
    updatedAt: v.updatedAt.toISOString()
  }))
})

