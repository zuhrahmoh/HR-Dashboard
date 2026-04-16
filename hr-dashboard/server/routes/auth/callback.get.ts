import { getQuery, sendRedirect } from 'h3'

export default defineEventHandler(async (event) => {
  const sessionConfig = getAuthSessionConfig(event)
  const session = await useSession(event, sessionConfig)
  const q = getQuery(event)
  const err = typeof q.error === 'string' ? q.error : ''
  if (err) {
    await session.update({ oauth_state: undefined, oauth_code_verifier: undefined })
    return sendRedirect(event, `/auth/login?error=${encodeURIComponent(err)}`, 302)
  }

  const code = typeof q.code === 'string' ? q.code : ''
  const state = typeof q.state === 'string' ? q.state : ''
  if (!code || !state) {
    return sendRedirect(event, '/auth/login?error=missing_code', 302)
  }

  const expected = session.data.oauth_state
  const verifier = session.data.oauth_code_verifier
  if (typeof expected !== 'string' || expected !== state || typeof verifier !== 'string') {
    return sendRedirect(event, '/auth/login?error=invalid_state', 302)
  }

  const r = getEntraAuthRuntime(event)
  assertEntraAuthConfigured(r)

  try {
    const { id_token } = await exchangeCodeForTokens(r, code, verifier)
    const user = await verifyIdTokenAndAssertRole(r, id_token)
    await session.update({
      user: {
        sub: user.sub,
        email: user.email,
        name: user.name
      },
      oauth_state: undefined,
      oauth_code_verifier: undefined
    })
  } catch (e: unknown) {
    const status = typeof e === 'object' && e && 'statusCode' in e ? Number((e as { statusCode: number }).statusCode) : 0
    if (status === 403) {
      await session.update({ oauth_state: undefined, oauth_code_verifier: undefined, user: undefined })
      return sendRedirect(event, '/auth/no-access', 302)
    }
    throw e
  }

  return sendRedirect(event, '/odoo', 302)
})
