import { getRequestURL } from 'h3'

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname
  if (!path.startsWith('/api/')) return
  if (path === '/api/auth/me') return

  const session = await useSession(event, getAuthSessionConfig(event))
  if (!session.data.user?.sub) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
})
