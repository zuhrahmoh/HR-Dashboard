import { loadOdooMedicalEnrolments } from '../../utils/odooMedicalEap'

export default defineEventHandler(async () => {
  return await loadOdooMedicalEnrolments()
})
