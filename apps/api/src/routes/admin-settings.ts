import {
  registrationCodeResponseSchema,
  updateRegistrationCodeSchema,
} from '@axiia/shared'
import { Hono } from 'hono'

import { getRegistrationCode, setRegistrationCode } from '../lib/settings'
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

export { adminSettingsRouter }
