import type { MiddlewareHandler } from 'hono'

import { isWriteLocked } from '../lib/settings'

export const WRITE_LOCK_ERROR = '系统维护中，暂时无法执行写操作'

export const requireWritesUnlocked: MiddlewareHandler = async (
  context,
  next,
) => {
  if (isWriteLocked()) {
    return context.json({ error: WRITE_LOCK_ERROR }, 503)
  }

  await next()
}
