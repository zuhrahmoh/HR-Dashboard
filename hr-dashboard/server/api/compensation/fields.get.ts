import { graphGetJson, getGraphAccessToken } from '../../utils/graph'

type GraphListItemsResponse = {
  value: Array<{
    id: string
    fields?: Record<string, unknown>
  }>
}

function encodeSiteIdForPath(siteId: string) {
  if (!siteId.includes(',')) return encodeURIComponent(siteId)
  return siteId
    .split(',')
    .map((p) => encodeURIComponent(p))
    .join(',')
}

export default defineEventHandler(async () => {
  const runtimeConfig = useRuntimeConfig()
  const tenantId = runtimeConfig.graph?.tenantId || ''
  const clientId = runtimeConfig.graph?.clientId || ''
  const clientSecret = runtimeConfig.graph?.clientSecret || ''
  const hostname = runtimeConfig.sharepoint?.hostname || ''
  const siteId = (runtimeConfig as any).sharepointSalary?.siteId || ''
  const listId = (runtimeConfig as any).sharepointSalary?.listId || ''

  const normalizedSiteId =
    siteId.includes(',') && !siteId.split(',')[0]?.includes('.') && hostname ? `${hostname},${siteId}` : siteId

  const accessToken = await getGraphAccessToken({ tenantId, clientId, clientSecret })
  const urls = [
    `https://graph.microsoft.com/v1.0/sites/${encodeSiteIdForPath(normalizedSiteId)}/lists/${encodeURIComponent(listId)}/items?$top=50&expand=fields`,
    `https://graph.microsoft.com/v1.0/sites/root/lists/${encodeURIComponent(listId)}/items?$top=50&expand=fields`
  ]

  let lastErr: unknown = null
  for (const url of urls) {
    try {
      const page = await graphGetJson<GraphListItemsResponse>({ accessToken, url })
      const keysSet = new Set<string>()
      for (const item of page.value || []) {
        const fields = item.fields || {}
        for (const k of Object.keys(fields)) keysSet.add(k)
      }
      return { keys: Array.from(keysSet).sort() }
    } catch (e) {
      lastErr = e
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.toLowerCase().includes('invalid hostname')) continue
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr || 'Failed to load fields'))
})

