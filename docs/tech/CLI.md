# Axiia Cup CLI Guide

`apps/cli` is the repository's admin and operations CLI. It can authenticate against the API, inspect tournaments, update scenarios, manage users, and operate playground runs.

## 1. Running the CLI

From the repository root:

```bash
bun run ./apps/cli/src/index.ts --help
```

If you want to build first and run the bundled output:

```bash
bun run --filter @axiia/cli build
bun ./apps/cli/dist/index.js --help
```

Current commands:

```text
auth:login --email <email> --password <password>
players --scenario <id>
players:prompts --scenario <id>
start <scenarioId>
status [tournamentId]
next-round <tournamentId>
terminate <tournamentId>
leaderboard <tournamentId>
scenarios
scenario:get <scenarioId>
scenario:update <scenarioId> --file <path|->
users:list
users:find --name <keyword>|--email <keyword>|--query <keyword>
users:disable <userId>
users:reset-password <userId> --password <password>
playground:run <submissionId>
playground:list <submissionId>
playground:get <submissionId> <runId>
playground:interrupt <submissionId> <runId>
battles
user:agents <userId>
agent:summary <submissionId> <side>
battle:export <source> <id>
monitor
monitor:player <userId>
playground:export <runId>
match:export <matchId>
```

Analytics and user-discovery commands now default to structured JSON output.
List-style commands support `--jsonl` for one-record-per-line output.

## 2. Environment Variables

The CLI reads these environment variables:

```bash
AXIIA_API_URL=http://localhost:3001
AXIIA_AUTH_TOKEN=<jwt>
AXIIA_ADMIN_TOKEN=<jwt>
AXIIA_DB_PATH=apps/api/axiia.db
```

Notes:

- `AXIIA_API_URL`: API base URL. Defaults to `http://localhost:3001`.
- `AXIIA_AUTH_TOKEN`: generic bearer token used for authenticated CLI calls.
- `AXIIA_ADMIN_TOKEN`: backward-compatible fallback. If `AXIIA_AUTH_TOKEN` is unset, the CLI will use this value instead.
- `AXIIA_DB_PATH`: only used by the local SQLite export commands.

In practice:

- authenticated but non-admin commands can use either a normal user token or an admin token
- admin commands require the token's user to actually have admin privileges on the server

Access model:

- resource-scoped reads and actions such as `playground:run`, `playground:list`, `playground:get`, and `playground:interrupt` accept either the owner or an admin token for the referenced `submissionId`
- user-scoped endpoints such as `/api/stats/me`, `/api/submissions/my`, and `/api/matches/my` stay scoped to one effective user; admins can switch that scope with `?asUserId=<id>`, which is what `monitor:player` uses internally

## 3. Authentication

### 3.1 Login via CLI

The CLI now provides `auth:login`:

```bash
bun run ./apps/cli/src/index.ts auth:login \
  --email admin@example.com \
  --password '<password>'
```

By default it prints a JSON object containing the token, user, and a ready-to-run `shellExport` field.

Useful variants:

```bash
bun run ./apps/cli/src/index.ts auth:login --email ... --password ... --token-only
bun run ./apps/cli/src/index.ts auth:login --email ... --password ... --shell
```

### 3.2 Manual Login via API

If you want to obtain the token yourself:

```bash
curl -sS "$AXIIA_API_URL/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"<email>","password":"<password>"}'
```

Then export the token:

```bash
export AXIIA_AUTH_TOKEN="<jwt>"
```

If you are already logged in through the web app, the browser stores the token in `localStorage` under `axiia-token`, which you can reuse manually.

## 4. Which Commands Use the API vs. Local SQLite

### 4.1 API-backed Commands

These commands call `AXIIA_API_URL`:

- `auth:login`
- `players --scenario <id>`
- `players:prompts --scenario <id>`
- `start <scenarioId>`
- `status [tournamentId]`
- `next-round <tournamentId>`
- `terminate <tournamentId>`
- `leaderboard <tournamentId>`
- `scenarios`
- `scenario:get <scenarioId>`
- `scenario:update <scenarioId> --file <path|->`
- `users:list`
- `users:find --name <keyword>|--email <keyword>|--query <keyword>`
- `users:disable <userId>`
- `users:reset-password <userId> --password <password>`
- `playground:run <submissionId>`
- `playground:list <submissionId>`
- `playground:get <submissionId> <runId>`
- `playground:interrupt <submissionId> <runId>`
- `battles`
- `user:agents <userId>`
- `agent:summary <submissionId> <side>`
- `battle:export <source> <id>`
- `monitor`
- `monitor:player <userId>`

### 4.2 Local SQLite-only Commands

These commands do not call the API. They read a local SQLite file directly:

- `playground:export <runId>`
- `match:export <matchId>`

If you are targeting a remote deployment, these export commands cannot read remote data unless you also have access to the server-side SQLite file.

## 5. Tournament and Scenario Commands

### 5.1 Tournament Operations

Examples:

```bash
bun run ./apps/cli/src/index.ts players --scenario shangyang-court
bun run ./apps/cli/src/index.ts players:prompts --scenario shangyang-court
bun run ./apps/cli/src/index.ts start shangyang-court
bun run ./apps/cli/src/index.ts status
bun run ./apps/cli/src/index.ts next-round 3
bun run ./apps/cli/src/index.ts terminate 3
bun run ./apps/cli/src/index.ts leaderboard 3
```

All of these commands now return JSON by default. Add `--jsonl` on list-style commands when you want one record per line.

Export all latest player prompts to a file:

```bash
bun run ./apps/cli/src/index.ts players:prompts \
  --scenario shangyang-court \
  --jsonl \
  --output /tmp/shangyang-court-prompts.jsonl
```

### 5.2 Scenario Listing

```bash
bun run ./apps/cli/src/index.ts scenarios
bun run ./apps/cli/src/index.ts scenarios --jsonl
```

### 5.3 Fetch a Scenario as JSON

```bash
bun run ./apps/cli/src/index.ts scenario:get shangyang-court
```

Or write it to a file:

```bash
bun run ./apps/cli/src/index.ts scenario:get shangyang-court \
  --output /tmp/shangyang-court.json
```

输出会包含 `kind` 字段以及完整的 admin scenario 对象，里面仍然保留 `id`、`title`、`subject`、`locked` 等只读元数据。

### 5.4 Update a Scenario

The old interactive `scenario:edit` flow has been removed. Scenario editing is now non-interactive and agent-friendly:

1. `scenarios`
2. `scenario:get <id>`
3. edit JSON externally
4. `scenario:update <id> --file <path|->`

Example:

```bash
bun run ./apps/cli/src/index.ts scenario:update shangyang-court \
  --file /tmp/shangyang-court.json
```

Or from stdin:

```bash
cat /tmp/shangyang-court.json | \
  bun run ./apps/cli/src/index.ts scenario:update shangyang-court --file -
```

Validation notes:

- `turnCount` must be between `1` and `50`
- `judgeModel` must be one of `deepseek-v3.2`, `kimi-k2.5`, `qwen3.5-397b-a17b`
- `openingLine`, `agentPromptTemplate`, `judgePrompt`, `scorerPrompt`, and both role names must be non-empty
- `examinationQuestionTemplate` may be empty
- hidden-info IDs and request IDs must be unique and must not overlap
- `falseInfoCount` and `trueRequestCount` cannot exceed the relevant list sizes

## 6. Playground Commands

Start a run:

```bash
bun run ./apps/cli/src/index.ts playground:run 42
```

Fetch a run:

```bash
bun run ./apps/cli/src/index.ts playground:get 42 108
```

Interrupt a running or queued run:

```bash
bun run ./apps/cli/src/index.ts playground:interrupt 42 108
```

The interrupt command returns the updated run payload as JSON. If the run had
already finished, it returns the current persisted run instead of failing.

Read-only fields such as `id`, `title`, `subject`, and `locked` may exist in the input JSON, but the CLI ignores them when building the update payload.

## 6. User Management Commands

The CLI now exposes the existing admin user-management API.

### 6.1 List Users

```bash
bun run ./apps/cli/src/index.ts users:list
bun run ./apps/cli/src/index.ts users:list --jsonl
```

### 6.2 Toggle Disabled State

```bash
bun run ./apps/cli/src/index.ts users:disable 42
```

The server-side route toggles the flag, so the same command disables or re-enables the user depending on their current state.

### 6.3 Find Users by Name or Email

```bash
bun run ./apps/cli/src/index.ts users:find --name Anna
bun run ./apps/cli/src/index.ts users:find --email anna@example.com
bun run ./apps/cli/src/index.ts users:find --query anna
bun run ./apps/cli/src/index.ts users:find --query anna --jsonl
```

This command reuses the admin user list and filters it locally by substring.

### 6.4 Reset Password

```bash
bun run ./apps/cli/src/index.ts users:reset-password 42 \
  --password 'new-password'
```

The response is JSON by default.

## 7. Playground Commands

The CLI now exposes the playground API as well.

### 7.1 Start a Playground Run

```bash
bun run ./apps/cli/src/index.ts playground:run 123
```

If the submission belongs to the authenticated user, the API returns a queued run ID as JSON.

### 7.2 List Playground Runs for a Submission

```bash
bun run ./apps/cli/src/index.ts playground:list 123
bun run ./apps/cli/src/index.ts playground:list 123 --jsonl
```

### 7.3 Fetch One Playground Run

```bash
bun run ./apps/cli/src/index.ts playground:get 123 456
```

Or write it to a file:

```bash
bun run ./apps/cli/src/index.ts playground:get 123 456 \
  --output /tmp/playground-run.json
```

The payload includes a `kind` field and a normalized `run` object.

### 7.4 Playground Availability

Playground runs are blocked while an official tournament is running. In that case the API returns the existing lock message:

```text
比赛进行中，试炼场暂停使用
```

## 8. Structured Output

Every command now emits JSON by default. These list-style commands also support `--jsonl`:

- `players`
- `leaderboard`
- `scenarios`
- `users:list`
- `users:find`
- `playground:list`
- `battles`
- `user:agents`
- `monitor`

Commands that already produced JSON and continue to do so:

- `scenario:get`
- `playground:get`
- `battle:export`
- `playground:export`
- `match:export`

## 9. Analytics Commands

The CLI now exposes the admin analytics API, which unifies official tournament
matches and Playground runs into one battle view.

### 9.1 List Battles

```bash
bun run ./apps/cli/src/index.ts battles
bun run ./apps/cli/src/index.ts battles --source playground --mode pve
bun run ./apps/cli/src/index.ts battles --source playground --mode pve --jsonl
bun run ./apps/cli/src/index.ts battles --user 42 --limit 20
```

Supported filters:

- `--user <id>`
- `--submission <id>`
- `--side <a|b>`
- `--source <tournament|playground>`
- `--mode <pvp|pve>`
- `--status <queued|running|judging|scored|error>`
- `--limit <n>`

### 9.2 List a User's Agents

```bash
bun run ./apps/cli/src/index.ts user:agents 42
bun run ./apps/cli/src/index.ts user:agents 42 --jsonl
```

Agents are reported at `submission + side` granularity, so one submission
produces two agents: `A` and `B`.

### 9.3 Inspect One Agent

```bash
bun run ./apps/cli/src/index.ts agent:summary 123 a
bun run ./apps/cli/src/index.ts agent:summary 123 b --output /tmp/agent-summary.json
```

This returns the agent's aggregated record plus recent battles.

### 9.4 Export One Battle from the API

```bash
bun run ./apps/cli/src/index.ts battle:export tournament 88
bun run ./apps/cli/src/index.ts battle:export playground 144 --output /tmp/battle.json
```

Unlike `playground:export` and `match:export`, this command reads through the
remote admin API and works without direct SQLite access.

## 10. Current Limits

The CLI still does not support:

- field-by-field scenario mutation such as `scenario:update --set key=value`
- changing a scenario's `id`, `title`, or `subject`
- exporting remote `playground_runs` / `matches` data directly from a remote server's SQLite database
