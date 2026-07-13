import type { H3Event } from 'h3'

interface AdminSessionData {
  admin?: boolean
}

const SESSION_CONFIG = {
  name: 'admin-session',
  maxAge: 60 * 60 * 24 * 7,
}

export function useAdminSession(event: H3Event) {
  const config = useRuntimeConfig()
  if (!config.sessionPassword) {
    throw createError({ statusCode: 500, statusMessage: 'NUXT_SESSION_PASSWORD is not set' })
  }
  return useSession<AdminSessionData>(event, {
    ...SESSION_CONFIG,
    password: config.sessionPassword,
  })
}

/** Guard for /api/admin routes: 401 unless the session was set by a login. */
export async function requireAdmin(event: H3Event) {
  const session = await useAdminSession(event)
  if (!session.data.admin) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
}
