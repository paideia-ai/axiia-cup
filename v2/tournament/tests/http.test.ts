// The HTTP adapter against a fake axiia server (the mock behind Deno.serve):
// pagination, pacing, and error codes.
import { assert, assertEquals, assertRejects } from '@std/assert'
import { HttpBackend, HttpError } from '../src/backend/http.ts'
import { MockBackend } from '../src/backend/mock.ts'
import { writeJSON } from '../src/cli.ts'
import { generateMockRoster } from '../src/mock/generate.ts'
import { runNext } from '../src/next.ts'
import { loadTournamentDir } from '../src/roster.ts'

const PAGE = 7 // smaller than the adapter asks for, to force paging

async function fakeServer() {
  const tmp = await Deno.makeTempDir()
  const mock = await MockBackend.open(`${tmp}/server.json`, { create: true })
  mock.data.failRate = 0
  const payloads = new Map<string, string>()
  const server = Deno.serve({ port: 0, onListen: () => {} }, async (req) => {
    if (req.headers.get('authorization') !== 'Bearer test-token') {
      return Response.json({ error: { code: 'unauthorized' } }, { status: 401 })
    }
    const url = new URL(req.url)
    if (req.method === 'POST' && url.pathname === '/v1/federation/matches/batch') {
      const { items } = await req.json()
      for (const item of items) {
        const body = JSON.stringify(item)
        const old = payloads.get(item.key)
        if (old && old !== body) {
          return Response.json({ error: { code: 'key_conflict' } }, { status: 409 })
        }
      }
      for (const item of items) payloads.set(item.key, JSON.stringify(item))
      return Response.json({ matches: await mock.submit(items) })
    }
    if (req.method === 'GET' && url.pathname === '/v1/federation/matches') {
      const tags = url.searchParams.getAll('tag')
      const after = Number(url.searchParams.get('after') ?? 0)
      const all = (await mock.query(tags)).filter((m) => m.matchID > after)
      const page = all.slice(0, PAGE)
      return Response.json({
        matches: page,
        next: all.length > PAGE ? page[page.length - 1].matchID : null,
      })
    }
    if (req.method === 'GET' && url.pathname === '/v1/federation/versions') {
      const ids = url.searchParams.getAll('id').map(Number)
      return Response.json(await mock.versions(ids))
    }
    return new Response('not found', { status: 404 })
  })
  const { port } = server.addr as Deno.NetAddr
  return { tmp, mock, server, base: `http://127.0.0.1:${port}` }
}

Deno.test('next paces to max in flight and pages through the query', async () => {
  const { tmp, mock, server, base } = await fakeServer()
  try {
    const http = new HttpBackend(base, 'test-token', 5)
    // The roster goes through the real versions endpoint.
    const { roster } = await generateMockRoster(mock, {
      scenarioID: 'shangyang-court',
      tournament: 'h1',
      seed: 's',
      Q: 24,
      K: 2,
      E: 4,
      R: 3,
      koSize: 4,
    })
    const dir = `${tmp}/t`
    await Deno.mkdir(dir)
    await writeJSON(`${dir}/roster.json`, roster)
    const t = await loadTournamentDir(dir)
    const quiet = () => {}

    // Round 1 of the 海选: 4 groups of 6 → 8 pairs → 16 games, 5 at a time.
    const first = await runNext(t, http, { log: quiet })
    assertEquals([first.created, first.heldBack], [5, 11])
    const capped = await runNext(t, http, { log: quiet })
    assertEquals([capped.created, capped.heldBack], [0, 11])
    mock.tick()
    let created = 5
    for (let i = 0; i < 10 && created < 16; i++) {
      created += (await runNext(t, http, { log: quiet })).created
      mock.tick()
    }
    assertEquals(created, 16)
    // More than one page of matches came back.
    assertEquals((await http.query(['h1/shangyang-court'])).length, 16)

    // A key reused with a different payload is a 409 key_conflict.
    const err = await assertRejects(
      () =>
        http.submit([{
          ...first.submitted[0],
          seed: 'another seed',
        }]),
      HttpError,
    )
    assertEquals([err.status, err.code], [409, 'key_conflict'])
  } finally {
    await server.shutdown()
    await Deno.remove(tmp, { recursive: true })
  }
})

Deno.test('unknown version ids are missing from versions(), not errors', async () => {
  const { tmp, server, base } = await fakeServer()
  try {
    const http = new HttpBackend(base, 'test-token')
    assertEquals(await http.versions([999]), [])
    const bad = new HttpBackend(base, 'wrong')
    const err = await assertRejects(() => bad.versions([1]), HttpError)
    assert(err.status === 401)
  } finally {
    await server.shutdown()
    await Deno.remove(tmp, { recursive: true })
  }
})
