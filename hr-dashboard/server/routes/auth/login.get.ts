import { getQuery, sendRedirect } from 'h3'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const qerr = typeof q.error === 'string' ? q.error : ''
  if (qerr) {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Sign-in</title></head><body style="font-family:system-ui;padding:2rem;max-width:40rem"><p>Sign-in could not be completed (${escapeHtml(qerr)}).</p><p><a href="/auth/login">Try again</a></p></body></html>`
    return new Response(html, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8' } })
  }

  const sessionConfig = getAuthSessionConfig(event)
  const session = await useSession(event, sessionConfig)
  if (session.data.user) {
    return sendRedirect(event, '/odoo', 302)
  }

  const r = getEntraAuthRuntime(event)
  assertEntraAuthConfigured(r)
  const { codeVerifier, codeChallenge, state } = generatePkce()

  await session.update({
    oauth_state: state,
    oauth_code_verifier: codeVerifier
  })

  return sendRedirect(event, buildAuthorizeUrl(r, state, codeChallenge), 302)
})

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
}
