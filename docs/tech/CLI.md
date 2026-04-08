# Axiia Cup CLI Guide

`apps/cli` is the repository's admin command-line tool. The CLI already existed, but the repo did not have a complete usage guide. This document covers how to run it, how to connect it to a remote API, and how to update scenario data with the new non-interactive workflow.

## 1. Running the CLI

From the repository root:

```bash
bun run ./apps/cli/src/index.ts --help
```

If you want to build first and then run the bundled output:

```bash
bun run --filter @axiia/cli build
bun ./apps/cli/dist/index.js --help
```

Current commands:

```text
players --scenario <id>
start <scenarioId>
status [tournamentId]
next-round <tournamentId>
leaderboard <tournamentId>
scenarios
scenario:get <scenarioId>
scenario:update <scenarioId> --file <path|->
playground:export <runId>
match:export <matchId>
```

## 2. Environment Variables

The CLI reads the following environment variables:

```bash
AXIIA_API_URL=http://localhost:3001
AXIIA_ADMIN_TOKEN=<admin-jwt>
AXIIA_DB_PATH=apps/api/axiia.db
```

Notes:

- `AXIIA_API_URL`: API base URL for the CLI. Defaults to `http://localhost:3001`. Avoid a trailing `/`.
- `AXIIA_ADMIN_TOKEN`: admin JWT. All admin-only commands depend on it.
- `AXIIA_DB_PATH`: only used by the local export commands that read SQLite directly.

## 3. Which Commands Use the API vs. Local SQLite

### 3.1 Commands That Call the API

These commands call `AXIIA_API_URL`:

- `players --scenario <id>`: admin endpoint, requires `AXIIA_ADMIN_TOKEN`
- `start <scenarioId>`: admin endpoint, requires `AXIIA_ADMIN_TOKEN`
- `status [tournamentId]`: public endpoint, does not require an admin token
- `next-round <tournamentId>`: admin endpoint, requires `AXIIA_ADMIN_TOKEN`
- `leaderboard <tournamentId>`: public endpoint, does not require an admin token
- `scenarios`: admin endpoint, requires `AXIIA_ADMIN_TOKEN`
- `scenario:get <scenarioId>`: admin endpoint, requires `AXIIA_ADMIN_TOKEN`
- `scenario:update <scenarioId> --file <path|->`: admin endpoint, requires `AXIIA_ADMIN_TOKEN`

### 3.2 Commands That Read Local SQLite Only

These commands do not call the API. They read a local SQLite file directly:

- `playground:export <runId>`
- `match:export <matchId>`

That means if you are targeting a remote deployment, these export commands cannot read remote data unless you also have access to the server-side SQLite file.

## 4. Connecting to a Remote Service

If the target is not local `localhost:3001` but a deployed API, configure both the base URL and an admin token first.

### 4.1 Set the API Base URL

```bash
export AXIIA_API_URL="https://your-api-host.example.com"
```

### 4.2 Get an Admin Token

The CLI does not currently provide a built-in `login` command, so you need to obtain a JWT through the login API and then assign it to `AXIIA_ADMIN_TOKEN`.

Example:

```bash
curl -sS "$AXIIA_API_URL/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"<admin-email>","password":"<admin-password>"}'
```

Expected response:

```json
{
  "token": "<jwt>",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "displayName": "Admin",
    "isAdmin": true
  }
}
```

Then export the token:

```bash
export AXIIA_ADMIN_TOKEN="<jwt>"
```

Additional notes:

- Only users with `user.isAdmin === true` can run the admin commands.
- The local setup script `bun run db:seed` / `apps/api/src/db/seed.ts` creates an admin account. Its defaults come from `AXIIA_ADMIN_EMAIL` and `AXIIA_ADMIN_PASSWORD`; if unset, the defaults are `admin@paideia.uno` / `axiia-cup`.
- Those defaults are only relevant for environments you seeded yourself. Do not assume a shared or production environment still uses them.
- If you are already logged in through the admin web UI, the web app stores the JWT in browser `localStorage` under the key `axiia-token`. You can reuse it manually if needed.

### 4.3 Example Remote Calls

```bash
export AXIIA_API_URL="https://your-api-host.example.com"
export AXIIA_ADMIN_TOKEN="<jwt>"

bun run ./apps/cli/src/index.ts scenarios
bun run ./apps/cli/src/index.ts players --scenario shangyang-court
bun run ./apps/cli/src/index.ts start shangyang-court
```

## 5. Updating Scenario Data from the CLI

The old interactive `scenario:edit` flow has been removed. Scenario editing is now a non-interactive, agent-friendly workflow:

1. `scenarios --json`: discover available scenario IDs
2. `scenario:get <scenarioId>`: fetch one scenario as JSON
3. Modify the JSON externally
4. `scenario:update <scenarioId> --file <path|->`: submit the updated payload

### 5.1 Fetch Scenario JSON

```bash
bun run ./apps/cli/src/index.ts scenarios --json
bun run ./apps/cli/src/index.ts scenario:get shangyang-court
```

You can also write the scenario JSON directly to a file:

```bash
bun run ./apps/cli/src/index.ts scenario:get shangyang-court \
  --output /tmp/shangyang-court.json
```

`scenario:get` returns the full admin scenario object, including:

- read-only metadata: `id`, `title`, `subject`, `locked`
- editable fields: protocol settings, prompts, roles, hidden info, requests, and randomization config

### 5.2 Submit a Scenario Update

```bash
bun run ./apps/cli/src/index.ts scenario:update shangyang-court \
  --file /tmp/shangyang-court.json
```

You can also read the JSON from stdin:

```bash
cat /tmp/shangyang-court.json | \
  bun run ./apps/cli/src/index.ts scenario:update shangyang-court --file -
```

Execution flow:

1. The CLI verifies that the scenario exists.
2. If the scenario is locked by a running tournament, the CLI fails with `比赛进行中，场景已锁定，无法编辑`.
3. The CLI reads JSON from `--file` or stdin.
4. The CLI ignores read-only fields and extracts only the editable payload for validation and submission.
5. The CLI sends `PUT /api/admin/scenarios/:id`.

### 5.3 Editable Payload

`scenario:update` ultimately submits an `UpdateScenario` payload with this shape:

```json
{
  "turnCount": 10,
  "judgeModel": "deepseek-v3.2",
  "openingLine": "秦孝公端坐殿上，命两人陈词。",
  "agentPromptTemplate": "...",
  "examinationQuestionTemplate": "...",
  "judgePrompt": "...",
  "scorerPrompt": "...",
  "roleAName": "商鞅",
  "roleAHiddenInfo": [
    { "id": "S1", "content": "Example hidden info" }
  ],
  "roleARequests": [
    { "id": "SR1", "content": "Example request" }
  ],
  "roleBName": "甘龙",
  "roleBHiddenInfo": [
    { "id": "G1", "content": "Example hidden info" }
  ],
  "roleBRequests": [
    { "id": "GR1", "content": "Example request" }
  ],
  "falseInfoCount": 1,
  "trueRequestCount": 1
}
```

Notes:

- The input JSON may still contain `id`, `title`, `subject`, and `locked`; the CLI ignores them.
- The actual update cannot change `id`, `title`, or `subject`.
- In practice, the CLI is suited for editing scenario protocol rules and prompt configuration, not for renaming scenarios or changing their subject classification.

### 5.4 Validation Rules

The server validates the submitted payload. Important rules include:

- `turnCount` must be between `1` and `50`
- `judgeModel` must be one of the supported model IDs: `deepseek-v3.2`, `kimi-k2.5`, `qwen3-32b`, `minimax-m2.5`
- `openingLine`, `agentPromptTemplate`, `judgePrompt`, `scorerPrompt`, and both role names must be non-empty
- `examinationQuestionTemplate` may be empty; an empty string means examination is skipped
- each item in `roleAHiddenInfo`, `roleBHiddenInfo`, `roleARequests`, and `roleBRequests` must be `{ id, content }`
- all IDs may contain only letters, digits, and underscores, and must start with a letter
- IDs must be unique within each list
- role A and role B hidden-info IDs cannot overlap
- role A and role B request IDs cannot overlap
- hidden-info IDs and request IDs cannot reuse the same value
- `falseInfoCount` cannot exceed the hidden-info count for either role
- `trueRequestCount` cannot exceed the request count for either role

### 5.5 Recommended Editing Workflow

For a remote scenario update, the typical flow is:

```bash
export AXIIA_API_URL="https://your-api-host.example.com"
export AXIIA_ADMIN_TOKEN="<jwt>"

bun run ./apps/cli/src/index.ts scenarios --json
bun run ./apps/cli/src/index.ts scenario:get shangyang-court --output /tmp/shangyang-court.json
# edit /tmp/shangyang-court.json
bun run ./apps/cli/src/index.ts scenario:update shangyang-court --file /tmp/shangyang-court.json
```

If the command returns:

```text
场景「商鞅变法·朝堂辩法」已更新
```

the remote update has been written successfully.

## 6. Current CLI Limits

The CLI already supports:

- connecting to a remote API to inspect and operate tournaments
- listing scenarios
- updating scenario protocol rules, prompts, roles, hidden info, requests, and randomization config through `scenario:get` / `scenario:update`

The CLI does not yet support:

- logging in directly and obtaining a token automatically
- field-by-field command-line updates such as `--set key=value`
- changing a scenario's `id`, `title`, or `subject`
- exporting remote `playground_runs` / `matches` data directly from a remote server's SQLite database
