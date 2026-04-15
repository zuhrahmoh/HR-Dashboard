import { loadOdooEapReferrals } from '../../utils/odooMedicalEap'

export default defineEventHandler(async () => {
  return await loadOdooEapReferrals()
})
