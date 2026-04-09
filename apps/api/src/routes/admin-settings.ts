import {
  registrationCodeResponseSchema,
  tokenSoftCapResponseSchema,
  updateRegistrationCodeSchema,
  updateTokenSoftCapSchema,
} from '@axiia/shared'
import { Hono } from 'hono'

import {
  getRegistrationCode,
  getTokenSoftCap,
  setRegistrationCode,
  setTokenSoftCap,
} from '../lib/settings'
import { requireAdmin } from '../middleware/requireAdmin'
import { requireAuth } from '../middleware/requireAuth'

const adminSettingsRouter = new Hono()

adminSettingsRouter.get(
  '/api/admin/settings/registration-code',
  requireAuth,
  requireAdmin,
  (context) => {
    return context.json(
      registrationCodeResponseSchema.parse({
        code: getRegistrationCode(),
      }),
    )
  },
)

adminSettingsRouter.put(
  '/api/admin/settings/registration-code',
  requireAuth,
  requireAdmin,
  async (context) => {
    const json = await context.req.json().catch(() => null)
    const parsed = updateRegistrationCodeSchema.safeParse(json)

    if (!parsed.success) {
      return context.json({ error: 'Invalid request body' }, 400)
    }

    const code = setRegistrationCode(parsed.data.code)

    return context.json(registrationCodeResponseSchema.parse({ code }))
  },
)

adminSettingsRouter.get(
  '/api/admin/settings/token-soft-cap',
  requireAuth,
  requireAdmin,
  (context) => {
    return context.json(
      tokenSoftCapResponseSchema.parse({
        cap: getTokenSoftCap(),
      }),
    )
  },
)

adminSettingsRouter.put(
  '/api/admin/settings/token-soft-cap',
  requireAuth,
  requireAdmin,
  async (context) => {
    const json = await context.req.json().catch(() => null)
    const parsed = updateTokenSoftCapSchema.safeParse(json)

    if (!parsed.success) {
      return context.json({ error: 'Invalid request body' }, 400)
    }

    setTokenSoftCap(parsed.data.cap)

    return context.json(
      tokenSoftCapResponseSchema.parse({ cap: getTokenSoftCap() }),
    )
  },
)

export { adminSettingsRouter }
