import { prisma } from '../utils/db'

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
  const items = await prisma.contractChange.findMany({ orderBy: { createdAt: 'desc' } })
  return items.map((v) => ({
    ...v,
    createdAt: v.createdAt.toISOString(),
    status: (v.status as any) ?? 'Approval required',
    changeTypes: Array.isArray(v.changeTypes)
      ? v.changeTypes.flatMap((t) => (t === ('Role, Reporting' as any) ? (['Role', 'Reporting'] as any) : [t]))
      : []
  }))
})

