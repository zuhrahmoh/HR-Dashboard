type TokenCache = {
  accessToken: string
  expiresAtMs: number
}

let tokenCache: TokenCache | null = null

function nowMs() {
  return Date.now()
}

function assertString(name: string, value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Missing required config: ${name}`)
  }
  return value.trim()
}

async function fetchJsonOrText(res: Response) {
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) return await res.json()
  return await res.text()
}

export async function getGraphAccessToken(input: { tenantId: string; clientId: string; clientSecret: string }) {
  const tenantId = assertString('GRAPH_TENANT_ID', input.tenantId)
  const clientId = assertString('GRAPH_CLIENT_ID', input.clientId)
  const clientSecret = assertString('GRAPH_CLIENT_SECRET', input.clientSecret)

  const cached = tokenCache
  const refreshSkewMs = 60_000
  if (cached && cached.expiresAtMs - refreshSkewMs > nowMs()) return cached.accessToken

  const url = `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`
  const body = new URLSearchParams()
  body.set('client_id', clientId)
  body.set('client_secret', clientSecret)
  body.set('grant_type', 'client_credentials')
  body.set('scope', 'https://graph.microsoft.com/.default')

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body
  })

  const payload = await fetchJsonOrText(res)
  if (!res.ok) {
    const details = typeof payload === 'string' ? payload : JSON.stringify(payload)
    throw new Error(`Failed to acquire Graph token (${res.status}): ${details}`)
  }

  const accessToken = typeof payload?.access_token === 'string' ? payload.access_token : ''
  const expiresIn = typeof payload?.expires_in === 'number' ? payload.expires_in : Number(payload?.expires_in || 0)
  if (!accessToken || !Number.isFinite(expiresIn) || expiresIn <= 0) {
    throw new Error('Graph token response missing access_token/expires_in')
  }

  tokenCache = { accessToken, expiresAtMs: nowMs() + expiresIn * 1000 }
  return accessToken
}

export async function graphGetJson<T>(input: { accessToken: string; url: string }): Promise<T> {
  const res = await fetch(input.url, {
    method: 'GET',
    headers: {
      authorization: `Bearer ${input.accessToken}`,
      accept: 'application/json'
    }
  })

  const payload = await fetchJsonOrText(res)
  if (!res.ok) {
    const details = typeof payload === 'string' ? payload : JSON.stringify(payload)
    throw new Error(`Graph request failed (${res.status}): ${details}`)
  }

  return payload as T
}

