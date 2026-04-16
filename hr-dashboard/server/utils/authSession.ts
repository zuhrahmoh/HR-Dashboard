import type { H3Event } from 'h3'
import type { SessionConfig } from 'h3'

export function getAuthSessionConfig(event: H3Event): SessionConfig {
  const { sessionPassword } = useRuntimeConfig(event)
  const password = String(sessionPassword ?? '').trim()
  if (password.length < 32) {
    throw createError({
      statusCode: 500,
      statusMessage: 'NUXT_SESSION_PASSWORD must be set to a random string of at least 32 characters.'
    })
  }
  return {
    password,
    name: 'hr',
    maxAge: 60 * 60 * 12,
    cookie: {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    }
  }
}
