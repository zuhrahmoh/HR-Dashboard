import { getQuery } from 'h3'
import { getCompensationForEmployeeName } from '../utils/sharepointCompensation'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const name = typeof q.name === 'string' ? q.name.trim() : ''
  if (!name) return null

  const runtimeConfig = useRuntimeConfig()
  const tenantId = runtimeConfig.graph?.tenantId || ''
  const clientId = runtimeConfig.graph?.clientId || ''
  const clientSecret = runtimeConfig.graph?.clientSecret || ''
  const hostname = runtimeConfig.sharepoint?.hostname || ''
  const siteId = (runtimeConfig as any).sharepointSalary?.siteId || ''
  const listId = (runtimeConfig as any).sharepointSalary?.listId || ''
  const cacheTtlMs = (runtimeConfig as any).sharepointSalary?.cacheTtlMs

  if (!tenantId || !clientId || !clientSecret || !hostname || !siteId || !listId) return null

  return await getCompensationForEmployeeName({
    tenantId,
    clientId,
    clientSecret,
    hostname,
    siteId,
    listId,
    cacheTtlMs,
    name
  })
})

