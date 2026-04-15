import { loadOdooContractChanges } from '../../utils/odooContractChanges'

export default defineEventHandler(async () => {
  return await loadOdooContractChanges()
})
