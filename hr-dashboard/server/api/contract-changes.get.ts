import { readJsonArray } from '../utils/jsonStore'

type ChangeType = 'Salary' | 'Role' | 'Reporting' | 'Job Title' | 'Contract Extension' | 'Non-Renewal'
type Status = 'Approval required' | 'Approved' | 'On Hold'

type ContractChange = {
  id: string
  employeeName: string
  country?: string
  department: string
  position: string
  changeTypes: ChangeType[]
  status?: Status
  description: string
  createdAt: string
}

export default defineEventHandler(async () => {
  const items = await readJsonArray<ContractChange>('contract-changes.json')
  return items
    .map((v) => ({
      ...v,
      status: v.status ?? 'Approval required',
      changeTypes: Array.isArray(v.changeTypes)
        ? v.changeTypes.flatMap((t) => (t === ('Role, Reporting' as any) ? (['Role', 'Reporting'] as any) : [t]))
        : []
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
})

