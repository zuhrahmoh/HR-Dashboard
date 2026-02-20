import { graphGetJson, getGraphAccessToken } from '../../utils/graph'

type GraphListsResponse = {
  value: Array<{ id: string; displayName?: string }>
}

export default defineEventHandler(async () => {
  const runtimeConfig = useRuntimeConfig()
  const tenantId = runtimeConfig.graph?.tenantId || ''
  const clientId = runtimeConfig.graph?.clientId || ''
  const clientSecret = runtimeConfig.graph?.clientSecret || ''

  const accessToken = await getGraphAccessToken({ tenantId, clientId, clientSecret })
  const url = 'https://graph.microsoft.com/v1.0/sites/root/lists?$select=id,displayName&$top=200'
  const res = await graphGetJson<GraphListsResponse>({ accessToken, url })
  return res.value || []
})

