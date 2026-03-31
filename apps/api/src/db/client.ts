import { mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'

import { schema } from './schema'

function resolveDatabasePath() {
  const configuredPath = process.env.AXIIA_DB_PATH

  if (configuredPath) {
    return resolve(process.cwd(), configuredPath)
  }

  const cwd = process.cwd()
  const fallbackPath = cwd.endsWith(join('apps', 'api'))
    ? resolve(cwd, 'axiia.db')
    : resolve(cwd, 'apps/api/axiia.db')

  return fallbackPath
}

export const sqliteFilePath = resolveDatabasePath()

mkdirSync(dirname(sqliteFilePath), { recursive: true })

export const sqlite = new Database(sqliteFilePath, { create: true })

sqlite.exec('PRAGMA journal_mode = WAL;')
sqlite.exec('PRAGMA foreign_keys = ON;')

export const db = drizzle(sqlite, { schema })
