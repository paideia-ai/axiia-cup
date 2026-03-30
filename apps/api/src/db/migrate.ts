import { migrate } from "drizzle-orm/bun-sqlite/migrator";

import { db, sqliteFilePath } from "./client";

const migrationsFolder = new URL("./migrations", import.meta.url).pathname;

migrate(db, { migrationsFolder });

console.log(`[db] migrated ${sqliteFilePath}`);
