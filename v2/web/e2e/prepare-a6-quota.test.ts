import assert from 'node:assert/strict'
import { createPreparationJournal } from './prepare-a5-quota.ts'
import {
  type A6QuotaEnvironment,
  lockA6QuotaResume,
  readA6QuotaCheckpoint,
  validateA6QuotaCLI,
} from './prepare-a6-quota.ts'

function config(): A6QuotaEnvironment {
  return {
    baseURL: 'http://127.0.0.1:3001',
    scenarioID: 'fixture',
    modelID: 'fixture-model',
    maxMatches: 10,
    matchTimeoutSeconds: 600,
    adminEmail: 'private-admin@axiia.test',
    adminPassword: 'private-admin-password',
    adminTotpSecret: 'PRIVATEADMINSECRET',
    privateOut: '/tmp/a6-private.jsonl',
    publicOut: '/tmp/a6-public.json',
  }
}

Deno.test('A6 CLI requires explicit cost, model, apply, fresh paths and either admin or private resume credentials', () => {
  assert.equal(validateA6QuotaCLI(['--apply'], config()).maxMatches, 10)
  const resumed = {
    ...config(),
    adminEmail: '',
    adminPassword: '',
    adminTotpSecret: '',
    resumeFrom: '/tmp/a6-prior.jsonl',
  }
  assert.equal(
    validateA6QuotaCLI(['--apply', '--resume'], resumed).resumeFrom,
    resumed.resumeFrom,
  )
  for (
    const args of [[], ['--resume'], ['--apply', '--apply'], [
      '--apply',
      '--resume',
      '--anything',
    ]]
  ) assert.throws(() => validateA6QuotaCLI(args, config()))
  for (
    const patch of [
      { maxMatches: NaN },
      { maxMatches: 21 },
      { modelID: '' },
      { adminEmail: '' },
      { privateOut: 'relative' },
      { publicOut: '/dev/null' },
      { publicOut: config().privateOut },
      { resumeFrom: '/tmp/old.jsonl' },
    ]
  ) {
    assert.throws(() =>
      validateA6QuotaCLI(['--apply'], { ...config(), ...patch })
    )
  }
  for (const resumeFrom of ['', 'relative', config().privateOut]) {
    assert.throws(() =>
      validateA6QuotaCLI(['--apply', '--resume'], { ...resumed, resumeFrom })
    )
  }
})

Deno.test('A6 private journal preserves complete checkpoints, excludes credentials from public output and refuses reused paths', async () => {
  const directory = await Deno.makeTempDir({ prefix: 'a6-checkpoint-' })
  const paths = {
    privateOut: `${directory}/private.jsonl`,
    publicOut: `${directory}/public.json`,
  }
  const bundle = {
    actor: {
      email: 'private-role@axiia.test',
      password: 'private-player-password',
    },
    registrationCode: 'PRIVATECODE',
    agents: [],
  }
  const manifest = {
    state: 'running',
    attempts: [{ state: 'accepted', matchID: 82 }],
  }
  const journal = await createPreparationJournal(paths, {
    record: 'preparation',
  }, [bundle.actor.email, bundle.actor.password, bundle.registrationCode])
  try {
    await journal.checkpoint(manifest, {
      record: 'checkpoint',
      bundle,
      manifest,
    })
    assert.deepEqual(await readA6QuotaCheckpoint(paths.privateOut), {
      bundle,
      manifest,
    })
    assert.equal((await Deno.stat(paths.privateOut)).mode! & 0o777, 0o600)
    assert.equal((await Deno.stat(paths.publicOut)).mode! & 0o777, 0o600)
    assert.deepEqual(
      JSON.parse(await Deno.readTextFile(paths.publicOut)),
      manifest,
    )
    await assert.rejects(
      createPreparationJournal(paths, {}, []),
      /cannot-create-new/,
    )
    await assert.rejects(
      journal.checkpoint({ ...manifest, accountID: 'should-stay-private' }),
    )
    await assert.rejects(
      journal.checkpoint({ ...manifest, failure: bundle.actor.password }),
    )
    assert.deepEqual(
      JSON.parse(await Deno.readTextFile(paths.publicOut)),
      manifest,
    )
  } finally {
    journal.close()
    await Deno.remove(directory, { recursive: true })
  }
})

Deno.test('A6 resume rejects symlinks, public permissions, malformed complete records and missing checkpoints', async () => {
  const directory = await Deno.makeTempDir({ prefix: 'a6-checkpoint-' })
  const path = `${directory}/private.jsonl`
  const value = {
    bundle: {
      actor: { email: 'private', password: 'value' },
      agents: [],
      registrationCode: 'value',
    },
    manifest: {
      state: 'partial',
      attempts: [{ state: 'accepted', matchID: 51 }],
    },
  }
  try {
    await Deno.writeTextFile(
      path,
      `${JSON.stringify({ record: 'checkpoint', ...value })}\n`,
      { mode: 0o600 },
    )
    assert.deepEqual(await readA6QuotaCheckpoint(path), value)
    await Deno.symlink(path, `${directory}/link`)
    await assert.rejects(
      readA6QuotaCheckpoint(`${directory}/link`),
      /private-regular/,
    )
    await Deno.chmod(path, 0o644)
    await assert.rejects(readA6QuotaCheckpoint(path), /private-regular/)
    await Deno.chmod(path, 0o600)
    await Deno.writeTextFile(path, '{invalid}\n')
    await assert.rejects(readA6QuotaCheckpoint(path))
    await Deno.writeTextFile(path, '{"record":"preparation"}\n')
    await assert.rejects(readA6QuotaCheckpoint(path), /checkpoint-missing/)
  } finally {
    await Deno.remove(directory, { recursive: true })
  }
})

Deno.test('A6 resume lock rejects concurrent or stale reuse and leaves durable checkpoint untouched', async () => {
  const directory = await Deno.makeTempDir({ prefix: 'a6-resume-lock-' })
  const path = `${directory}/private.jsonl`
  await Deno.writeTextFile(path, '{"record":"checkpoint"}\n', { mode: 0o600 })
  const before = await Deno.readTextFile(path)
  try {
    const release = await lockA6QuotaResume(path)
    assert.equal((await Deno.stat(`${path}.resume.lock`)).mode! & 0o777, 0o600)
    await assert.rejects(lockA6QuotaResume(path), /resume-locked/)
    assert.equal(await Deno.readTextFile(path), before)
    await release()
    const again = await lockA6QuotaResume(path)
    await again()
    assert.equal(await Deno.readTextFile(path), before)
  } finally {
    await Deno.remove(directory, { recursive: true })
  }
})

Deno.test('A6 truncated accepted tail retains pending refusal evidence instead of replaying a POST', async () => {
  const directory = await Deno.makeTempDir({ prefix: 'a6-truncated-' })
  const path = `${directory}/private.jsonl`
  const pending = {
    record: 'checkpoint',
    bundle: { actor: {}, agents: [] },
    manifest: { attempts: [{ state: 'request-pending' }] },
  }
  try {
    await Deno.writeTextFile(
      path,
      `${
        JSON.stringify(pending)
      }\n{"record":"checkpoint","manifest":{"attempts":[{"state":"accepted","matchID":42`,
      { mode: 0o600 },
    )
    assert.deepEqual(
      (await readA6QuotaCheckpoint(path)).manifest,
      pending.manifest,
    )
  } finally {
    await Deno.remove(directory, { recursive: true })
  }
})
