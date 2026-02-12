import { graphGetJson, getGraphAccessToken } from '../../utils/graph'

type GraphListItemsResponse = {
  value: Array<{
    id: string
    fields?: Record<string, unknown>
  }>
}

export default defineEventHandler(async () => {
  const runtimeConfig = useRuntimeConfig()
  const tenantId = runtimeConfig.graph?.tenantId || ''
  const clientId = runtimeConfig.graph?.clientId || ''
  const clientSecret = runtimeConfig.graph?.clientSecret || ''
  const listId = runtimeConfig.sharepoint?.listId || ''

  const accessToken = await getGraphAccessToken({ tenantId, clientId, clientSecret })
  const url = `https://graph.microsoft.com/v1.0/sites/root/lists/${encodeURIComponent(listId)}/items?$top=1&$expand=fields`
  const page = await graphGetJson<GraphListItemsResponse>({ accessToken, url })
  const fields = page.value?.[0]?.fields || {}
  return { keys: Object.keys(fields).sort(), fields }
})

