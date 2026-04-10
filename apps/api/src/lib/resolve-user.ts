import type { Context } from 'hono'

export function isAdminRequest(context: Context): boolean {
  return context.get('isAdmin') === true
}

export function canAccessUserId(context: Context, ownerUserId: number): boolean {
  return isAdminRequest(context) || context.get('userId') === ownerUserId
}

/**
 * Returns the effective userId for the request.
 * If the caller is an admin and provides ?asUserId=N, returns that userId
 * (admin impersonation). Otherwise returns the authenticated user's own id.
 */
export function resolveUserId(context: Context): number {
  const jwtUserId = context.get('userId') as number

  if (!isAdminRequest(context)) {
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
