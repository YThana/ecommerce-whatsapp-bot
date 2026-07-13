export default defineEventHandler(async (event) => {
  const session = await useAdminSession(event)
  return { authenticated: session.data.admin === true }
})
