export default defineEventHandler(async (event) => {
  const session = await useSession(event, getAuthSessionConfig(event))
  const user = session.data.user
  if (!user?.sub) {
    return { authenticated: false as const, user: null as const }
  }
  return {
    authenticated: true as const,
    user: {
      sub: user.sub,
      email: user.email ?? '',
      name: user.name ?? ''
    }
  }
})
