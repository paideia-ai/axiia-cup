import type { Context } from 'hono'

/**
 * Returns the effective userId for the request.
 * If the caller is an admin and provides ?asUserId=N, returns that userId
 * (admin impersonation). Otherwise returns the authenticated user's own id.
 */
export function resolveUserId(context: Context): number {
  const jwtUserId = context.get('userId') as number
  const isAdmin = context.get('isAdmin') as boolean | undefined

  if (!isAdmin) {
    return jwtUserId
  }

  const raw = context.req.query('asUserId')

  if (!raw) {
    return jwtUserId
  }

  const parsed = Number(raw)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return jwtUserId
  }

  return parsed
}
