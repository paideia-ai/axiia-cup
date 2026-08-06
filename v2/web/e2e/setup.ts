// Offline seed step for the browser e2e. Talks to a locally-running `axiia serve`
// as the freshly-minted admin: login → TOTP-elevate → create a registration code.
// Scenarios and preset opponents are compiled into the binary catalog, so there is
// nothing left to seed for them — the run picks the first catalog scenario and
// prints its id and title for the browser flow to drive.
//
// Usage: deno run -A setup.ts <baseURL> <adminEmail> <adminPassword> <totpSecret>

import { adminSession } from './http.ts'

const [baseURL, email, password, totpSecret] = Deno.args
if (!baseURL || !email || !password || !totpSecret) {
  console.error('usage: setup.ts <baseURL> <email> <password> <totpSecret>')
  Deno.exit(2)
}

interface ScenarioSummary {
  id: string
  title: string
}

const registrationCode = 'CUP2026'
const session = await adminSession(baseURL, email, password, totpSecret)
await session.call('POST', '/v1/admin/registration-codes', {
  code: registrationCode,
  uses: 100,
})

const catalog = await session.call<{ scenarios: ScenarioSummary[] }>(
  'GET',
  '/v1/scenarios',
)
const scenario = catalog.scenarios[0]
if (!scenario) {
  console.error('the binary catalog is empty; nothing to drive the e2e with')
  Deno.exit(1)
}

console.log(
  JSON.stringify({
    registrationCode,
    scenarioID: scenario.id,
    scenarioTitle: scenario.title,
  }),
)
