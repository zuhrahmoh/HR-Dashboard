import { clearSession, getRequestURL, sendRedirect } from 'h3'

export default defineEventHandler(async (event) => {
  const sessionConfig = getAuthSessionConfig(event)
  await clearSession(event, sessionConfig)
  const r = getEntraAuthRuntime(event)
  if (!r.tenantId) {
    return sendRedirect(event, '/auth/login', 302)
  }
  const origin = getRequestURL(event).origin
  const post = encodeURIComponent(`${origin}/`)
  return sendRedirect(
    event,
    `https://login.microsoftonline.com/${encodeURIComponent(r.tenantId)}/oauth2/v2.0/logout?post_logout_redirect_uri=${post}`,
    302
  )
})
