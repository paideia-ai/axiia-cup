import { app } from './app'
import { cors } from 'hono/cors'

import { startWorker } from './engine/worker'
import { authRouter } from './routes/auth'
import { appMetaSchema, modelOptions } from '@axiia/shared'
import { playgroundRouter } from './routes/playground'
import { scenariosRouter } from './routes/scenarios'
import { statsRouter } from './routes/stats'
import { submissionsRouter } from './routes/submissions'
import { tournamentRouter } from './routes/tournaments'
import { db } from './db/client'
import { scenarios } from './db/schema'

const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

app.use(
  '*',
  cors({
    origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins,
    allowHeaders: ['Authorization', 'Content-Type'],
    allowMethods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  }),
)

app.get('/', (context) =>
  context.json({
    name: 'Axiia Cup API',
    status: 'ok',
  }),
)

app.get('/health', (context) =>
  context.json({
    ok: true,
    timestamp: new Date().toISOString(),
  }),
)

app.get('/api/meta', (context) => {
  const scenarioSummaries = db
    .select({
      id: scenarios.id,
      roleAName: scenarios.roleAName,
      roleBName: scenarios.roleBName,
      subject: scenarios.subject,
      summary: scenarios.context,
      title: scenarios.title,
      turnCount: scenarios.turnCount,
    })
    .from(scenarios)
    .all()

  const payload = appMetaSchema.parse({
    name: 'Axiia Cup',
    stage: 'mvp',
    models: modelOptions,
    scenarios: scenarioSummaries,
  })

  return context.json(payload)
})

app.get('/api/models', (context) => context.json({ items: modelOptions }))
app.route('/', authRouter)
app.route('/', playgroundRouter)
app.route('/', scenariosRouter)
app.route('/', statsRouter)
app.route('/', submissionsRouter)
app.route('/', tournamentRouter)

const port = Number(process.env.PORT ?? 3001)

Bun.serve({
  port,
  fetch: app.fetch,
})

console.log(`[api] listening on http://localhost:${port}`)

startWorker()
