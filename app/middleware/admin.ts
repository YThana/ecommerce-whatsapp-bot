export default defineNuxtRouteMiddleware(async () => {
  const { authenticated } = await $fetch('/api/admin/me')
  if (!authenticated) {
    return navigateTo('/admin/login')
  }
})
