import { app } from './app'
import { cors } from 'hono/cors'

import { startWorker } from './engine/worker'
import { adminMonitorRouter } from './routes/admin-monitor'
import { adminAnalyticsRouter } from './routes/admin-analytics'
import { adminSettingsRouter } from './routes/admin-settings'
import { adminUsersRouter } from './routes/admin-users'
import { authRouter } from './routes/auth'
import { appMetaSchema, playerModelOptions } from '@axiia/shared'
import { playgroundRouter } from './routes/playground'
import { presetOpponentsRouter } from './routes/preset-opponents'
import { scenariosRouter } from './routes/scenarios'
import { statsRouter } from './routes/stats'
import { submissionsRouter } from './routes/submissions'
import { tournamentRouter } from './routes/tournaments'
import { db } from './db/client'
import { scenarios } from './db/schema'
import { shutdownLangfuseTracing } from './lib/langfuse'

const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

app.use(
  '*',
  cors({
    origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins,
    allowHeaders: ['Authorization', 'Content-Type'],
    allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'OPTIONS'],
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
    buildSha: process.env.APP_BUILD_SHA ?? 'unknown',
  }),
)

app.get('/api/meta', (context) => {
  const scenarioSummaries = db
    .select({
      id: scenarios.id,
      roleAName: scenarios.roleAName,
      roleBName: scenarios.roleBName,
      subject: scenarios.subject,
      summary: scenarios.title,
      title: scenarios.title,
      turnCount: scenarios.turnCount,
    })
    .from(scenarios)
    .all()

  const payload = appMetaSchema.parse({
    name: 'Axiia Cup',
    stage: 'mvp',
    models: playerModelOptions,
    scenarios: scenarioSummaries,
  })

  return context.json(payload)
})

app.get('/api/models', (context) => context.json({ items: playerModelOptions }))
app.route('/', adminAnalyticsRouter)
app.route('/', adminMonitorRouter)
app.route('/', adminSettingsRouter)
app.route('/', adminUsersRouter)
app.route('/', authRouter)
app.route('/', playgroundRouter)
app.route('/', presetOpponentsRouter)
app.route('/', scenariosRouter)
app.route('/', statsRouter)
app.route('/', submissionsRouter)
app.route('/', tournamentRouter)

const port = Number(process.env.PORT ?? 3001)

const server = Bun.serve({
  port,
  fetch: app.fetch,
})

let isShuttingDown = false

async function shutdown(signal: 'SIGINT' | 'SIGTERM') {
  if (isShuttingDown) {
    return
  }

  isShuttingDown = true
  console.log(`[api] ${signal} received, shutting down`)

  try {
    await server.stop(true)
    await shutdownLangfuseTracing()
  } catch (error) {
    console.error('[api] graceful shutdown failed', error)
  } finally {
    process.exit(0)
  }
}

process.once('SIGINT', () => void shutdown('SIGINT'))
process.once('SIGTERM', () => void shutdown('SIGTERM'))

startWorker()
console.log(`[api] listening on http://localhost:${port}`)
