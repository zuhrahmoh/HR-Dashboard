const PUBLIC_PATHS = new Set(['/auth/login', '/auth/callback', '/auth/logout', '/auth/no-access'])

export default defineNuxtRouteMiddleware(async (to) => {
  if (PUBLIC_PATHS.has(to.path)) return

  const { data } = await useFetch<{ authenticated: boolean }>('/api/auth/me', { key: 'auth-me' })
  if (!data.value?.authenticated) {
    return navigateTo('/auth/login')
  }
})
