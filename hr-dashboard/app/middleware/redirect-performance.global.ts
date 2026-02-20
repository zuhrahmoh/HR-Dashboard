export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/performance') {
    return navigateTo('/contracts', { replace: true })
  }
})

