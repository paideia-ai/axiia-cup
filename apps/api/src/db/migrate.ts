import { migrate } from 'drizzle-orm/bun-sqlite/migrator'

import { db, sqliteFilePath } from './client'
import { ensureHonnojiScenario } from './honnoji-scenario'
import { ensureTrolleyScenario } from './trolley-scenario'

const migrationsFolder = new URL('./migrations', import.meta.url).pathname

migrate(db, { migrationsFolder })
ensureHonnojiScenario()
ensureTrolleyScenario()

console.log(`[db] migrated ${sqliteFilePath}`)
