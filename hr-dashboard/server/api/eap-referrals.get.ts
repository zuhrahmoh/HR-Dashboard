import { readJsonArray } from '../utils/jsonStore'

type EapReferral = {
  id: string
  employeeName: string
  country: string
  referralSource?: string
  referralDate: string
  reasonCategory: string
  reasonDetails?: string
  programStatus: string
  startDate?: string
  lastFollowUpDate?: string
  nextFollowUpDate?: string
  outcomeNotes?: string
  ownerHr?: string
  referralDocsUrl?: string
  closeDate?: string
  closedReason?: string
  createdAt: string
  updatedAt: string
}

export default defineEventHandler(async () => {
  const items = await readJsonArray<EapReferral>('eap-referrals.json')
  return items.sort((a, b) => (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt))
})

