import { migrate } from 'drizzle-orm/bun-sqlite/migrator'

import { db, sqliteFilePath } from './client'
import { ensureHonnojiScenario } from './honnoji-scenario'

const migrationsFolder = new URL('./migrations', import.meta.url).pathname

migrate(db, { migrationsFolder })
ensureHonnojiScenario()

console.log(`[db] migrated ${sqliteFilePath}`)
