import { loadOdooDisciplinaryCases } from '../../utils/odooDisciplinaryCases'

export default defineEventHandler(async () => {
  return await loadOdooDisciplinaryCases()
})
