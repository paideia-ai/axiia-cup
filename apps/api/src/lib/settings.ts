import { eq } from 'drizzle-orm'

import { db } from '../db/client'
import { appSettings } from '../db/schema'

const REGISTRATION_CODE_KEY = 'registrationCode'
const WRITE_LOCK_KEY = 'writeLock'

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
  return (
    getSetting(REGISTRATION_CODE_KEY) ??
    process.env.REGISTRATION_CODE ??
    'axiia_cup'
  )
}

export function setRegistrationCode(code: string) {
  return setSetting(REGISTRATION_CODE_KEY, code)
}

export function isWriteLocked() {
  return getSetting(WRITE_LOCK_KEY) === '1'
}

export function setWriteLock(locked: boolean) {
  return setSetting(WRITE_LOCK_KEY, locked ? '1' : '0') === '1'
}

const TOKEN_SOFT_CAP_KEY = 'tokenSoftCap'

export function getTokenSoftCap(): number {
  const value = getSetting(TOKEN_SOFT_CAP_KEY)
  const parsed = value ? Number(value) : Number.NaN
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 500_000
}

export function setTokenSoftCap(cap: number) {
  return setSetting(TOKEN_SOFT_CAP_KEY, String(cap))
}
