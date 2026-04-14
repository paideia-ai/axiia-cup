import { performance } from 'node:perf_hooks'

const [url, concurrencyArg = '10', requestsArg = '100', method = 'GET', headersJson = '{}', body = ''] = process.argv.slice(2)

if (!url) {
  console.error('usage: bun .tmp/loadtest.mjs <url> <concurrency> <requests> [method] [headersJson] [body]')
  process.exit(1)
}

const concurrency = Number(concurrencyArg)
const requests = Number(requestsArg)
const headers = JSON.parse(headersJson)
let completed = 0
let started = 0
let failures = 0
const latencies = []
const statuses = new Map()

async function worker() {
  while (true) {
    const index = started++
    if (index >= requests) return

    const begin = performance.now()
    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body || undefined,
      })
      await response.text()
      const elapsed = performance.now() - begin
      latencies.push(elapsed)
      statuses.set(response.status, (statuses.get(response.status) ?? 0) + 1)
      if (!response.ok) failures += 1
    } catch {
      const elapsed = performance.now() - begin
      latencies.push(elapsed)
      failures += 1
      statuses.set('NETWORK_ERROR', (statuses.get('NETWORK_ERROR') ?? 0) + 1)
    } finally {
      completed += 1
    }
  }
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0
  const index = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))
  return sorted[index]
}

const startedAt = performance.now()
await Promise.all(Array.from({ length: concurrency }, () => worker()))
const totalMs = performance.now() - startedAt
latencies.sort((a, b) => a - b)
const avg = latencies.reduce((sum, value) => sum + value, 0) / Math.max(1, latencies.length)

console.log(
  JSON.stringify(
    {
      url,
      concurrency,
      requests,
      completed,
      failures,
      totalMs: Number(totalMs.toFixed(2)),
      rps: Number((completed / (totalMs / 1000)).toFixed(2)),
      latencyMs: {
        min: Number((latencies[0] ?? 0).toFixed(2)),
        avg: Number(avg.toFixed(2)),
        p50: Number(percentile(latencies, 50).toFixed(2)),
        p90: Number(percentile(latencies, 90).toFixed(2)),
        p95: Number(percentile(latencies, 95).toFixed(2)),
        p99: Number(percentile(latencies, 99).toFixed(2)),
        max: Number((latencies.at(-1) ?? 0).toFixed(2)),
      },
      statuses: Object.fromEntries(statuses),
    },
    null,
    2,
  ),
)
