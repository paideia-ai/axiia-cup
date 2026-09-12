import { execFile } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { createServer, request as httpRequest } from 'node:http'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'
import { expect, test } from '@playwright/test'
import { adminContext, baseURL, sameOrigin } from './helpers'

const run = promisify(execFile)
test.use({ screenshot: 'off', trace: 'off', video: 'off' })
test.skip(
  process.env.AXIIA_E2E_ISOLATED !== '1' || !process.env.AXIIA_DB_PATH ||
    !/^http:\/\/(localhost|127\.0\.0\.1|\[::1\]):\d+$/.test(baseURL),
  'Only runner-owned isolated SQLite and loopback API may create these actors',
)

test(
  'supplied A6 code provisions exactly three isolated actors with no administrative CLI requests',
  async ({ request }, testInfo) => {
    expect((await request.get('/v1/scenarios')).ok()).toBe(true)
    test.setTimeout(180_000)
    const directory = await mkdtemp(join(tmpdir(), 'a6-supplied-code-'))
    const code = `A6-local-${randomBytes(16).toString('hex')}`
    const untouchedCode = `reserved-local-${randomBytes(16).toString('hex')}`
    const scenarioID = `a6-signup-${randomBytes(8).toString('hex')}`
    const admin = await adminContext()
    const posts: string[] = []
    const blocked: string[] = []
    let signups = 0
    // The CLI sees only this bounded ordinary-player proxy. Setup admin requests
    // use the runner's private context directly and never reach the CLI process.
    const proxy = createServer(async (req, res) => {
      const path = req.url ?? ''
      const method = req.method ?? ''
      const chunks: Buffer[] = []
      for await (const chunk of req) chunks.push(Buffer.from(chunk))
      const body = Buffer.concat(chunks)
      let permitted = method === 'GET' && path.startsWith('/v1/') &&
        !path.startsWith('/v1/admin/')
      if (method === 'POST') {
        posts.push(path)
        permitted =
          /^\/v1\/(?:auth\/signup|agents(?:\/\d+\/save)?|matches\/pv[ep])$/
            .test(path)
        if (path === '/v1/auth/signup') {
          const payload = JSON.parse(body.toString())
          signups++
          permitted = permitted && signups <= 3 && payload.code === code &&
            /^hv-a6-(?:entry(?:-first-save)?|daily-exhausted)-[0-9a-f]{24}@axiia\.test$/
              .test(payload.email)
        }
      }
      if (!permitted) {
        blocked.push(`${method} ${path}`)
        res.writeHead(403, { 'Content-Type': 'application/json' })
        res.end('{"error":"test-proxy-denied"}')
        return
      }
      const target = new URL(path, baseURL)
      const upstream = httpRequest(target, {
        method,
        headers: { ...req.headers, host: target.host },
      }, (response) => {
        res.writeHead(response.statusCode!, response.headers)
        response.pipe(res)
      })
      upstream.on('error', () => res.destroy())
      upstream.end(body)
    })
    const snapshot = async () => {
      // Read only. Code values go through the child environment, never argv/output.
      const result = await run('python3', [
        '-c',
        `
import json,os,sqlite3
db=sqlite3.connect('file:'+os.environ['AXIIA_DB_PATH']+'?mode=ro',uri=True)
db.execute('PRAGMA query_only=1')
tables=['users','agents','agent_versions','matches','dispatches','journal','turns','registration_codes']
counts={t:db.execute('SELECT COUNT(*) FROM '+t).fetchone()[0] for t in tables}
uses=[db.execute('SELECT uses_remaining FROM registration_codes WHERE code=?',(os.environ[k],)).fetchone()[0] for k in ['A6_CODE','A6_UNTOUCHED_CODE']]
print(json.dumps({'counts':counts,'remainingUses':uses}))
db.close()
`,
      ], {
        env: {
          ...process.env,
          A6_CODE: code,
          A6_UNTOUCHED_CODE: untouchedCode,
        },
      })
      return JSON.parse(result.stdout) as {
        counts: Record<string, number>
        remainingUses: number[]
      }
    }
    try {
      const upload = await admin.post('/v1/admin/scripts', {
        headers: sameOrigin,
        data: {
          source: `const meta = {
id: '${scenarioID}', title: 'A6 signup code isolated fixture', subject: '测试',
sideAName: '正方', sideBName: '反方', sideALabel: '正方', sideBLabel: '反方', turnCount: 1,
stages: [{id:'main',title:'对话',channels:[{id:'main',label:'对话'}]}],
presets: [{key:'npc-b',side:'b',label:'固定陪练',modelID:'deepseek-v4-flash',prompt:'offline'}]
}; async function main() { game.emit('main',{type:'scene',text:'固定局，无模型调用。'}); return {winner:'a',scoreA:1,scoreB:0,reasoning:'固定局'}; }`,
        },
      })
      expect(upload.ok()).toBe(true)
      const { sha } = await upload.json()
      expect((await admin.patch(`/v1/admin/slots/${scenarioID}`, {
        headers: sameOrigin,
        data: { scriptSHA: sha, params: {} },
      })).ok()).toBe(true)
      for (const [value, uses] of [[code, 3], [untouchedCode, 2]] as const) {
        expect((await admin.post('/v1/admin/registration-codes', {
          headers: sameOrigin,
          data: { code: value, uses },
        })).ok()).toBe(true)
      }
      const config = await (await admin.get('/v1/config')).json()
      expect(config.dailyBattleLimit).toBeGreaterThan(0)
      expect(config.dailyBattleLimit).toBeLessThanOrEqual(20)
      const modelID = config.models[0].id
      const before = await snapshot()
      await new Promise<void>((resolve) =>
        proxy.listen(0, '127.0.0.1', resolve)
      )
      const address = proxy.address() as { port: number }
      const common = {
        ...process.env,
        AXIIA_BASE_URL: `http://127.0.0.1:${address.port}`,
        AXIIA_A6_REGISTRATION_CODE: code,
        AXIIA_ADMIN_EMAIL: '',
        AXIIA_ADMIN_PASSWORD: '',
        AXIIA_ADMIN_TOTP_SECRET: '',
        AXIIA_A6_ENTRY_SCENARIO: scenarioID,
        AXIIA_A6_ENTRY_MODEL_ID: modelID,
        AXIIA_A6_QUOTA_SCENARIO: scenarioID,
        AXIIA_A6_QUOTA_MODEL_ID: modelID,
        AXIIA_A6_QUOTA_MAX_MATCHES: String(config.dailyBattleLimit),
        AXIIA_A6_QUOTA_MATCH_TIMEOUT_SECONDS: '30',
      }
      const manifests: Array<Record<string, unknown>> = []
      for (const kind of ['entry', 'quota']) {
        const privateOut = join(directory, `${kind}.jsonl`)
        const publicOut = join(directory, `${kind}.json`)
        let stdout = ''
        try {
          const result = await run('deno', [
            'run',
            '-A',
            '--no-config',
            `e2e/prepare-a6-${kind}.ts`,
            '--apply',
          ], {
            cwd: resolve('.'),
            env: {
              ...common,
              AXIIA_PRIVATE_OUT: privateOut,
              AXIIA_PUBLIC_OUT: publicOut,
            },
            timeout: 120_000,
            maxBuffer: 2 * 1024 * 1024,
          })
          stdout = result.stdout
        } catch {
          throw new Error(
            `isolated ${kind} CLI failed; private subprocess output suppressed`,
          )
        }
        const publicText = await readFile(publicOut, 'utf8')
        const records = (await readFile(privateOut, 'utf8')).trim().split('\n')
          .map((line) => JSON.parse(line))
        const last = records.at(-1)
        const actors = kind === 'entry'
          ? last.bundle.roles
          : [last.bundle.actor]
        for (
          const secret of [
            code,
            untouchedCode,
            ...actors.flatMap((
              actor: { email: string; password: string },
            ) => [actor.email, actor.password]),
          ]
        ) {
          expect(publicText.includes(secret) || stdout.includes(secret)).toBe(
            false,
          )
        }
        const manifest = JSON.parse(publicText)
        expect(manifest.state).toBe('ready')
        manifests.push(manifest)
        if (kind === 'entry') {
          const afterEntry = await snapshot()
          expect(afterEntry.remainingUses).toEqual([1, 2])
          expect(afterEntry.counts.users - before.counts.users).toBe(2)
          expect(afterEntry.counts.matches).toBe(before.counts.matches)
        }
      }
      const after = await snapshot()
      expect(after.remainingUses).toEqual([0, 2])
      expect(after.counts.users - before.counts.users).toBe(3)
      expect(after.counts.agents - before.counts.agents).toBe(6)
      expect(after.counts.agent_versions - before.counts.agent_versions).toBe(6)
      expect(after.counts.registration_codes).toBe(
        before.counts.registration_codes,
      )
      expect(after.counts.matches - before.counts.matches).toBe(
        config.dailyBattleLimit,
      )
      expect(after.counts.dispatches - before.counts.dispatches).toBe(
        config.dailyBattleLimit,
      )
      expect(after.counts.journal).toBe(before.counts.journal)
      expect(signups).toBe(3)
      expect(blocked).toEqual([])
      expect(posts.filter((path) => /admin|login|elevate/.test(path))).toEqual(
        [],
      )
      await writeFile(
        testInfo.outputPath('supplied-code-report.json'),
        JSON.stringify(
          { before, after, signups, posts, blocked, manifests },
          null,
          2,
        ),
        { mode: 0o600 },
      )
    } finally {
      proxy.closeAllConnections()
      if (proxy.listening) {
        await new Promise<void>((resolve) => proxy.close(() => resolve()))
      }
      await admin.dispose()
      await rm(directory, { recursive: true, force: true })
    }
  },
)
