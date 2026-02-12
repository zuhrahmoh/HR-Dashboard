import { getQuery } from 'h3'
import { loadExpenses } from '../utils/expenses'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const month = typeof q.month === 'string' ? q.month : undefined
  const compareTo = typeof q.compareTo === 'string' ? q.compareTo : undefined
  const runtimeConfig = useRuntimeConfig()
  return await loadExpenses({ runtimeConfig, month, compareTo })
})

