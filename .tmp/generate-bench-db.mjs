import { Database } from 'bun:sqlite'
import { mkdirSync, rmSync } from 'node:fs'
import { dirname } from 'node:path'
import { hashSync } from '../apps/api/node_modules/bcryptjs/index.js'

const dbPath = process.argv[2]
if (!dbPath) {
  console.error('usage: bun .tmp/generate-bench-db.mjs <dbPath>')
  process.exit(1)
}

rmSync(dbPath, { force: true })
mkdirSync(dirname(dbPath), { recursive: true })
const db = new Database(dbPath, { create: true })

db.exec(`
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = OFF;

CREATE TABLE users (
  id integer primary key autoincrement,
  email text not null unique,
  password_hash text not null,
  display_name text not null default 'momo',
  is_admin integer not null default 0,
  disabled integer not null default 0,
  created_at text not null default CURRENT_TIMESTAMP
);

CREATE TABLE appSettings (
  key text primary key,
  value text not null
);

CREATE TABLE scenarios (
  id text primary key,
  title text not null,
  subject text not null,
  turn_count integer not null default 10,
  judge_model text not null default 'deepseek-v3.2',
  opening_line text not null default '',
  agent_prompt_template text not null,
  examination_question_template text not null default '',
  judge_prompt text not null,
  scorer_prompt text not null default '',
  role_a_name text not null,
  role_a_hidden_info text not null default '[]',
  role_a_requests text not null default '[]',
  role_b_name text not null,
  role_b_hidden_info text not null default '[]',
  role_b_requests text not null default '[]',
  false_info_count integer not null default 1,
  true_request_count integer not null default 1,
  created_at text not null default CURRENT_TIMESTAMP
);

CREATE TABLE submissions (
  id integer primary key autoincrement,
  user_id integer not null,
  scenario_id text not null,
  prompt_a text not null,
  prompt_b text not null,
  model text not null,
  retired_at text,
  version integer not null,
  created_at text not null default CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX submissions_user_scenario_version ON submissions(user_id, scenario_id, version);
CREATE INDEX submissions_scenario_id_created_at_idx ON submissions(scenario_id, created_at);

CREATE TABLE preset_opponents (
  id integer primary key autoincrement,
  scenario_id text not null,
  role text not null,
  label text not null,
  prompt text not null,
  created_at text not null default CURRENT_TIMESTAMP
);

CREATE TABLE playground_runs (
  id integer primary key autoincrement,
  submission_id integer not null,
  status text not null default 'queued',
  lease_token text,
  scenario_id text not null,
  opponent_mode text not null default 'self',
  preset_opponent_id integer,
  actual_prompt_a text,
  actual_prompt_b text,
  transcript text not null default '[]',
  judge_transcript_a text not null default '[]',
  judge_transcript_b text not null default '[]',
  info_assignment text,
  judge_decision text,
  score_a real,
  score_b real,
  winner text,
  reasoning text,
  error text,
  created_at text not null default CURRENT_TIMESTAMP
);
CREATE INDEX playground_runs_status_created_at_idx ON playground_runs(status, created_at);
CREATE INDEX playground_runs_submission_id_created_at_idx ON playground_runs(submission_id, created_at);

CREATE TABLE tournaments (
  id integer primary key autoincrement,
  scenario_id text not null,
  status text not null default 'open',
  current_round integer not null default 0,
  total_rounds integer not null default 4,
  created_at text not null default CURRENT_TIMESTAMP
);

CREATE TABLE rounds (
  id integer primary key autoincrement,
  tournament_id integer not null,
  round_number integer not null,
  status text not null
);
CREATE INDEX rounds_tournament_id_round_number_idx ON rounds(tournament_id, round_number);

CREATE TABLE matches (
  id integer primary key autoincrement,
  round_id integer not null,
  scenario_id text not null,
  sub_a_id integer not null,
  sub_b_id integer not null,
  status text not null default 'queued',
  current_turn integer not null default 0,
  transcript text not null default '[]',
  judge_transcript_a text not null default '[]',
  judge_transcript_b text not null default '[]',
  info_assignment text,
  judge_decision text,
  score_a real,
  score_b real,
  winner text,
  reasoning text,
  error text,
  lease_token text,
  started_at text,
  finished_at text,
  updated_at text,
  created_at text not null default CURRENT_TIMESTAMP
);
CREATE INDEX matches_round_id_idx ON matches(round_id);
CREATE INDEX matches_status_created_at_idx ON matches(status, created_at);

CREATE TABLE llm_calls (
  id integer primary key autoincrement,
  match_id integer,
  playground_run_id integer,
  user_id integer,
  phase text not null,
  side text not null,
  turn_index integer,
  attempt integer not null default 1,
  model text not null,
  provider text not null default 'siliconflow',
  request_json text not null,
  response_json text,
  response_content text,
  error text,
  duration_ms integer not null,
  prompt_tokens integer,
  completion_tokens integer,
  created_at text not null default CURRENT_TIMESTAMP
);
CREATE INDEX llm_calls_match_id_idx ON llm_calls(match_id);
CREATE INDEX llm_calls_playground_run_id_idx ON llm_calls(playground_run_id);
CREATE INDEX llm_calls_user_id_idx ON llm_calls(user_id);
`)

const userCount = Number(process.env.BENCH_USER_COUNT ?? 200)
const roundCount = Number(process.env.BENCH_ROUND_COUNT ?? 3)
const turnsPerMatch = Number(process.env.BENCH_TURNS ?? 10)
const llmCallsPerMatch = Number(process.env.BENCH_LLM_CALLS_PER_MATCH ?? 24)

const now = new Date('2026-04-09T12:00:00.000Z')
const iso = (offsetSeconds = 0) => new Date(now.getTime() + offsetSeconds * 1000).toISOString().replace('T', ' ').replace('Z', '')
const benchPassword = 'benchpass123'
const benchPasswordHash = hashSync(benchPassword, 10)

const agentPrompt = 'You are a debating agent. Stay in role. '.repeat(30)
const judgePrompt = 'You are the judge. Evaluate both sides carefully. '.repeat(40)
const scorerPrompt = 'Output JSON score only. '.repeat(20)

const roleARequests = JSON.stringify([
  { id: 'A1', content: 'A request 1' },
  { id: 'A2', content: 'A request 2' },
  { id: 'A3', content: 'A request 3' },
])
const roleBRequests = JSON.stringify([
  { id: 'B1', content: 'B request 1' },
  { id: 'B2', content: 'B request 2' },
  { id: 'B3', content: 'B request 3' },
])

const insertUser = db.prepare('INSERT INTO users (email, password_hash, display_name, is_admin, disabled, created_at) VALUES (?, ?, ?, ?, ?, ?)')
const insertScenario = db.prepare('INSERT INTO scenarios (id, title, subject, turn_count, judge_model, opening_line, agent_prompt_template, examination_question_template, judge_prompt, scorer_prompt, role_a_name, role_a_hidden_info, role_a_requests, role_b_name, role_b_hidden_info, role_b_requests, false_info_count, true_request_count, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
const insertSubmission = db.prepare('INSERT INTO submissions (user_id, scenario_id, prompt_a, prompt_b, model, retired_at, version, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
const insertTournament = db.prepare('INSERT INTO tournaments (scenario_id, status, current_round, total_rounds, created_at) VALUES (?, ?, ?, ?, ?)')
const insertRound = db.prepare('INSERT INTO rounds (tournament_id, round_number, status) VALUES (?, ?, ?)')
const insertMatch = db.prepare('INSERT INTO matches (round_id, scenario_id, sub_a_id, sub_b_id, status, current_turn, transcript, judge_transcript_a, judge_transcript_b, info_assignment, judge_decision, score_a, score_b, winner, reasoning, error, lease_token, started_at, finished_at, updated_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
const insertLlmCall = db.prepare('INSERT INTO llm_calls (match_id, playground_run_id, user_id, phase, side, turn_index, attempt, model, provider, request_json, response_json, response_content, error, duration_ms, prompt_tokens, completion_tokens, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')

insertScenario.run(
  'shangyang-court',
  'Benchmark Scenario',
  'history',
  turnsPerMatch,
  'deepseek-v3.2',
  'Opening line',
  agentPrompt,
  'Guess the true request',
  judgePrompt,
  scorerPrompt,
  '商鞅',
  '[]',
  roleARequests,
  '甘龙',
  '[]',
  roleBRequests,
  0,
  1,
  iso(),
)

insertUser.run('admin@bench.local', benchPasswordHash, 'admin', 1, 0, iso())

const submissionIds = []
for (let i = 1; i <= userCount; i += 1) {
  insertUser.run(
    `user${i}@bench.local`,
    benchPasswordHash,
    `user${i}`,
    0,
    0,
    iso(i),
  )
  insertSubmission.run(
    i + 1,
    'shangyang-court',
    `Prompt A for user ${i}. ` + 'strategy '.repeat(60),
    `Prompt B for user ${i}. ` + 'counterstrategy '.repeat(60),
    i % 3 === 0 ? 'qwen3-235b-a22b' : i % 2 === 0 ? 'deepseek-v3.1' : 'kimi-k2.5',
    null,
    1,
    iso(i),
  )
  submissionIds.push(db.query('SELECT last_insert_rowid() as id').get().id)
}

insertTournament.run('shangyang-court', 'finished', roundCount, roundCount, iso(500))
const tournamentId = db.query('SELECT last_insert_rowid() as id').get().id

let llmCreated = 0
let matchCreated = 0
for (let round = 1; round <= roundCount; round += 1) {
  insertRound.run(tournamentId, round, 'done')
  const roundId = db.query('SELECT last_insert_rowid() as id').get().id
  const rotated = submissionIds.slice(round - 1).concat(submissionIds.slice(0, round - 1))

  for (let i = 0; i + 1 < submissionIds.length; i += 2) {
    const subA = submissionIds[i]
    const subB = rotated[i + 1] ?? submissionIds[(i + 1) % submissionIds.length]
    if (subA === subB) continue

    for (const [left, right] of [[subA, subB], [subB, subA]]) {
      const transcript = Array.from({ length: turnsPerMatch }, (_, turn) => ({
        speaker: turn % 2 === 0 ? 'a' : 'b',
        role: turn % 2 === 0 ? '商鞅' : '甘龙',
        content: `Round ${round} match ${matchCreated + 1} turn ${turn + 1}: ` + '论证内容'.repeat(20),
      }))
      const judgeTranscript = [
        { round: 1, question: '哪条是真请求？', answer: '我选择 A1', selectedInfoId: 'A1', isCorrect: true },
      ]
      const infoAssignment = {
        roleAFalseInfoIds: [],
        roleBFalseInfoIds: [],
        roleATrueRequestIds: ['A1'],
        roleBTrueRequestIds: ['B2'],
      }
      insertMatch.run(
        roundId,
        'shangyang-court',
        left,
        right,
        'scored',
        turnsPerMatch,
        JSON.stringify(transcript),
        JSON.stringify(judgeTranscript),
        JSON.stringify(judgeTranscript),
        JSON.stringify(infoAssignment),
        '{"judgment":"变法"}',
        7.5,
        6.25,
        'a',
        'Detailed reasoning. '.repeat(20),
        null,
        null,
        iso(600 + matchCreated),
        iso(620 + matchCreated),
        iso(620 + matchCreated),
        iso(600 + matchCreated),
      )
      const matchId = db.query('SELECT last_insert_rowid() as id').get().id
      matchCreated += 1

      const userIdA = db.query('SELECT user_id as userId FROM submissions WHERE id = ?').get(left).userId
      const userIdB = db.query('SELECT user_id as userId FROM submissions WHERE id = ?').get(right).userId
      for (let c = 0; c < llmCallsPerMatch; c += 1) {
        const side = c % 4 === 0 ? 'a' : c % 4 === 1 ? 'b' : c % 4 === 2 ? 'judge' : 'scorer'
        const userId = side === 'a' ? userIdA : side === 'b' ? userIdB : null
        insertLlmCall.run(
          matchId,
          null,
          userId,
          side === 'judge' ? 'judgment' : side === 'scorer' ? 'scoring' : 'dialogue',
          side,
          c,
          1,
          'deepseek-v3.2',
          'siliconflow',
          JSON.stringify({ messages: 5, approx: c }),
          JSON.stringify({ usage: { prompt_tokens: 400 + c, completion_tokens: 120 + c } }),
          'response '.repeat(20),
          null,
          300 + (c % 50),
          400 + c,
          120 + c,
          iso(700 + llmCreated),
        )
        llmCreated += 1
      }
    }
  }
}

db.exec('PRAGMA foreign_keys = ON;')

const counts = {
  users: db.query('SELECT count(*) as count FROM users').get().count,
  submissions: db.query('SELECT count(*) as count FROM submissions').get().count,
  tournaments: db.query('SELECT count(*) as count FROM tournaments').get().count,
  rounds: db.query('SELECT count(*) as count FROM rounds').get().count,
  matches: db.query('SELECT count(*) as count FROM matches').get().count,
  llmCalls: db.query('SELECT count(*) as count FROM llm_calls').get().count,
}

console.log(JSON.stringify({ dbPath, benchPassword, counts }, null, 2))
