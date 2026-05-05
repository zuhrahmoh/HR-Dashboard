import * as jose from 'jose'
import { createHash, randomBytes } from 'node:crypto'

export type EntraAuthRuntime = {
  tenantId: string
  clientId: string
  clientSecret: string
  redirectUri: string
  requiredRole: string
}

// Minimal OIDC scopes (no offline_access — avoids refresh-token consent; session re-login is enough for this app)
const SCOPES = 'openid profile email'

export function getEntraAuthRuntime(event: Parameters<typeof useRuntimeConfig>[0]): EntraAuthRuntime {
  const config = useRuntimeConfig(event)
  const auth = (config as { auth?: Partial<EntraAuthRuntime> }).auth ?? {}
  return {
    tenantId: String(auth.tenantId ?? '').trim(),
    clientId: String(auth.clientId ?? '').trim(),
    clientSecret: String(auth.clientSecret ?? '').trim(),
    redirectUri: String(auth.redirectUri ?? '').trim() || 'http://localhost:3000/auth/callback',
    requiredRole: String(auth.requiredRole ?? '').trim() || 'HR.User'
  }
}

export function assertEntraAuthConfigured(r: EntraAuthRuntime) {
  if (!r.tenantId || !r.clientId || !r.clientSecret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Entra login is not configured (AUTH_TENANT_ID, AUTH_CLIENT_ID, AUTH_CLIENT_SECRET).'
    })
  }
}

export function buildAuthorizeUrl(r: EntraAuthRuntime, state: string, codeChallenge: string) {
  const base = `https://login.microsoftonline.com/${encodeURIComponent(r.tenantId)}/oauth2/v2.0/authorize`
  const p = new URLSearchParams({
    client_id: r.clientId,
    response_type: 'code',
    redirect_uri: r.redirectUri,
    response_mode: 'query',
    scope: SCOPES,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  })
  return `${base}?${p.toString()}`
}

export function generatePkce() {
  const codeVerifier = randomBytes(32).toString('base64url')
  const codeChallenge = createHash('sha256').update(codeVerifier, 'utf8').digest('base64url')
  const state = randomBytes(24).toString('base64url')
  return { codeVerifier, codeChallenge, state }
}

export async function exchangeCodeForTokens(
  r: EntraAuthRuntime,
  code: string,
  codeVerifier: string
): Promise<{ id_token: string }> {
  const tokenUrl = `https://login.microsoftonline.com/${encodeURIComponent(r.tenantId)}/oauth2/v2.0/token`
  const body = new URLSearchParams({
    client_id: r.clientId,
    client_secret: r.clientSecret,
    scope: SCOPES,
    code,
    redirect_uri: r.redirectUri,
    grant_type: 'authorization_code',
    code_verifier: codeVerifier
  })
  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body
  })
  const json = (await res.json().catch(() => null)) as Record<string, unknown> | null
  if (!res.ok) {
    const desc = typeof json?.error_description === 'string' ? json.error_description : await res.text()
    throw createError({
      statusCode: 401,
      statusMessage: `Token exchange failed: ${desc || res.statusText}`
    })
  }
  const idToken = json?.id_token
  if (typeof idToken !== 'string') {
    throw createError({ statusCode: 502, statusMessage: 'Token response missing id_token.' })
  }
  return { id_token: idToken }
}

export async function verifyIdTokenAndAssertRole(r: EntraAuthRuntime, idToken: string) {
  const issuer = `https://login.microsoftonline.com/${r.tenantId}/v2.0`
  const JWKS = jose.createRemoteJWKSet(
    new URL(`https://login.microsoftonline.com/${r.tenantId}/discovery/v2.0/keys`)
  )
  const { payload } = await jose.jwtVerify(idToken, JWKS, {
    issuer,
    audience: r.clientId,
    clockTolerance: 60
  })
  const rolesRaw = payload.roles
  const roles = Array.isArray(rolesRaw) ? rolesRaw : rolesRaw != null ? [rolesRaw] : []
  const roleStrings = roles.map((x) => String(x))
  if (!roleStrings.includes(r.requiredRole)) {
    throw createError({
      statusCode: 403,
      statusMessage: `Missing required app role "${r.requiredRole}".`
    })
  }
  return {
    sub: String(payload.sub ?? ''),
    email: typeof payload.email === 'string' ? payload.email : '',
    name: typeof payload.name === 'string' ? payload.name : ''
  }
}
