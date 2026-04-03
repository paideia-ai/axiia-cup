import { eq } from 'drizzle-orm'

import { db } from '../db/client'
import { appSettings } from '../db/schema'

const REGISTRATION_CODE_KEY = 'registrationCode'

function getSetting(key: string) {
  const setting = db
    .select({ value: appSettings.value })
    .from(appSettings)
    .where(eq(appSettings.key, key))
    .get()

  return setting?.value ?? null
}

function setSetting(key: string, value: string) {
  db.insert(appSettings)
    .values({ key, value })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value },
    })
    .run()

  return value
}

export function getRegistrationCode() {
  return getSetting(REGISTRATION_CODE_KEY) ?? process.env.REGISTRATION_CODE ?? 'axiia_cup'
}

export function setRegistrationCode(code: string) {
  return setSetting(REGISTRATION_CODE_KEY, code)
}
