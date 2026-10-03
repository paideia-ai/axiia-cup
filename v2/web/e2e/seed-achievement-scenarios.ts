import { adminSession } from './http.ts'

const [base, email, password, secret] = Deno.args
if (
  !base || !email || !password || !secret ||
  !['127.0.0.1', 'localhost', '[::1]'].includes(new URL(base).hostname)
) throw new Error('Provide the local API URL and preview admin credentials.')

const session = await adminSession(base, email, password, secret)
const root = new URL('../../scenarios/scenarios/', import.meta.url)
for await (const entry of Deno.readDir(root)) {
  if (!entry.isDirectory) continue
  const source = await Deno.readTextFile(
    new URL(`${entry.name}/script.js`, root),
  )
  const { sha } = await session.call<{ sha: string }>(
    'POST',
    '/v1/admin/scripts',
    {
      source,
    },
  )
  await session.call('PATCH', `/v1/admin/slots/${entry.name}`, {
    scriptSHA: sha,
    status: 'live',
  })
  console.log(`Installed current scenario: ${entry.name}`)
}
