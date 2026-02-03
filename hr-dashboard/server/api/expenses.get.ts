import { loadExpensesFromCsv } from '../utils/expenses'

export default defineEventHandler(async () => {
  return await loadExpensesFromCsv()
})

