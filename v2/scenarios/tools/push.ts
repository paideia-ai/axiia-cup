// Pushes every scenario in this directory to a running axiia server and retires
// the live slots that no longer exist here. Idempotent: script upload is
// content-addressed, and a slot patch that changes nothing still lands the same
// row. Auth is a `kat_` machine token, which is CSRF-exempt and needs no TOTP.
//
//   deno task push            # AXIIA_BASE_URL + AXIIA_TOKEN from the environment
//   deno task push --dry-run  # print the plan, touch nothing

const dryRun = Deno.args.includes('--dry-run')

const baseURL = (Deno.env.get('AXIIA_BASE_URL') ?? '').replace(/\/$/, '')
const token = Deno.env.get('AXIIA_TOKEN') ?? ''
if (!baseURL || !token) {
  console.error('AXIIA_BASE_URL and AXIIA_TOKEN are both required')
  Deno.exit(2)
}

async function api<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(`${baseURL}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!response.ok) {
    throw new Error(
      `${method} ${path} -> ${response.status} ${await response.text()}`,
    )
  }
  return await response.json() as T
}

const local = new Map<string, string>()
for await (const entry of Deno.readDir('scenarios')) {
  if (!entry.isDirectory) continue
  const path = `scenarios/${entry.name}/script.js`
  if (!(await Deno.stat(path).catch(() => null))?.isFile) continue
  local.set(entry.name, await Deno.readTextFile(path))
}
if (local.size === 0) {
  console.error('no scenarios found under scenarios/')
  Deno.exit(2)
}

const before = await api<{ slots: { id: string; status: string }[] }>(
  'GET',
  '/v1/admin/slots',
)
const liveElsewhere = before.slots
  .filter((slot) => slot.status === 'live' && !local.has(slot.id))
  .map((slot) => slot.id)

// Upload every script before repointing any slot. The server evaluates `meta` in
// its sandbox on upload and rejects a script that would abort a boot, so this is
// the authoritative validation — and doing it for the whole set first means one
// bad script fails the run without leaving half the scenarios updated.
const uploaded = new Map<string, string>()
for (const [id, source] of [...local].sort()) {
  if (dryRun) {
    const known = before.slots.find((slot) => slot.id === id)
    console.log(`push ${id}${known === undefined ? ' (new slot)' : ''}`)
    continue
  }
  const { sha } = await api<{ sha: string }>('POST', '/v1/admin/scripts', {
    source,
  })
  uploaded.set(id, sha)
}

for (const [id, sha] of uploaded) {
  // title and meta are always recomputed server-side from the script itself, and
  // params/status are left alone, so pointing the slot at the sha is the whole
  // update.
  await api('PATCH', `/v1/admin/slots/${id}`, { scriptSHA: sha })
  console.log(`pushed ${id} ${sha.slice(0, 12)}`)
}

for (const id of liveElsewhere.sort()) {
  if (dryRun) {
    console.log(`retire ${id}`)
    continue
  }
  await api('PATCH', `/v1/admin/slots/${id}`, { status: 'retired' })
  console.log(`retired ${id}`)
}

console.log(
  `${
    dryRun ? 'planned' : 'done'
  }: ${local.size} pushed, ${liveElsewhere.length} retired`,
)
