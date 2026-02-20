import { graphGetJson, getGraphAccessToken } from '../../utils/graph'

type GraphListsResponse = {
  value: Array<{ id: string; displayName?: string }>
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

  const normalizedSiteId =
    siteId.includes(',') && !siteId.split(',')[0]?.includes('.') && hostname ? `${hostname},${siteId}` : siteId

  const accessToken = await getGraphAccessToken({ tenantId, clientId, clientSecret })
  const url = `https://graph.microsoft.com/v1.0/sites/${encodeSiteIdForPath(normalizedSiteId)}/lists?$select=id,displayName&$top=200`
  const res = await graphGetJson<GraphListsResponse>({ accessToken, url })
  return res.value || []
})

