---
name: axiia-scenario-authoring
description: Write, port, and validate axiia scenario scripts — the deterministic sandboxed games under v2/scenarios/scenarios. Covers the script contract, determinism rules, journal/replay semantics, emit vocabulary, affordances, structured judge calls, plain-JS scoring, slot params/meta/status, how a script reaches the server, and the relay / information-fidelity design patterns.
---

# Authoring axiia scenarios

A scenario is one self-contained JavaScript file at
`v2/scenarios/scenarios/<slot-id>/script.js`. The axiia server runs it
deterministically in a sandboxed JS engine: the server owns model providers,
persistence, streaming, and replay; the script owns the game. You need no Swift
toolchain and no server checkout to write one — deno 2.9.1 and this directory
are the whole workbench.

Existing exemplars, all in this repo: `shangyang-court` (dealt cards,
pull-judge, ledger scoring) and `fengyiting-real` (visibility routing and
dual-role NPC verdicts). Read one end to end before writing your own.

## The workbench

```sh
cd v2/scenarios
deno task validate   # every scenario: meta extraction, id/directory match,
                     # confiscated globals, typecheck against types/axiia.d.ts
deno task fmt        # --check; run `deno fmt .` to fix
deno task lint
```

`types/axiia.d.ts` declares the whole injected API as globals. Scenario scripts
are plain scripts, not modules, so there is nothing to import — open
`scenarios/<id>/script.js` in an editor with TypeScript and completion for
`game.` and `agent.` just works, provided the editor picks up
`tsconfig.check.json`.

What `validate` proves, per scenario:

- the file parses, and `meta` is computable at top level without the host
- `meta.id` equals the directory name
- no confiscated global is used (a textual scan — see Determinism rules)
- every `game.*` / `agent.*` call matches the declared API, and `meta` and
  `main`'s return value satisfy `ScenarioMeta` / `ScenarioMain`

What it cannot prove, and CI does: CI runs the server's own sandboxed meta
extraction, which is the authority on whether a descriptor is acceptable. Local
`meta` reading is a faithful stand-in, not the real engine. Nothing local runs
your `main` — there is no model, no journal, no replay outside the server.

`deno task fmt` deliberately skips `scenarios/`: those files are mirrored
byte-for-byte with the server repo, and they are mostly long CJK prose strings
that the formatter would shred. Match the surrounding style by hand — two-space
indent, single quotes, no semicolons.

## Script contract and lifecycle

A script declares exactly two globals — no imports, no modules:

```js
const meta = { id, title, subject, sideAName, sideBName, sideALabel, sideBLabel,
               turnCount, stages, presets, speakerLabels }
async function main() { …; return { winner, scoreA, scoreB, reasoning } }
```

- `meta.id` **is** the slot id and must equal the directory name.
- Meta extraction evaluates `<source>;meta` without running `main` — so `meta`
  must be computable without `game`, without effects, at top level. Prompts and
  helpers may live at top level too; they run on every meta extraction, so keep
  top level pure and cheap.
- `stages: [{ id, title, channels: [{ id, label }] }]` is the static channel map
  the web timeline groups by. Channels are fixed at authoring time; when the
  channel flow is data-dependent (branching storylines), declare the superset —
  unused channels simply stay empty.
- `presets: [{ key, side: 'a'|'b', label, prompt, modelID }]` is the default PvE
  opponent roster; provide at least one per side (the shipped scripts carry two
  per side). Slot `params.presets` can replace this roster wholesale at runtime;
  absent that key, `meta.presets` is authoritative.
- `speakerLabels: { laneName: display }` maps agent lane names to display names.
  Cover every lane that ever produces a timeline row, including NPC and judge
  lanes.
- `main`'s return value finishes the match (`winner` is `'a'`/`'b'`); a throw
  fails it. Scoring is **plain JS in the script** — there is no LLM scorer.

## Injected API (the whole surface)

```txt
game.params                      // slot params, plain JSON — read tunables here
game.side('a'|'b')               // { prompt, model, label } for that participant
game.playerPrompt('a'|'b')       // the opaque player artifact text
game.agent(name, { system, model?, effort?, side? })
game.emit(channel, event)        // spectator timeline event row
game.phase(title)                // sugar: emit('*', {type:'phase', title})
await game.random()              // journaled draw in [0, 1)

agent.push(text)                 // append a scene/system event to the session
agent.hear(speaker, text)        // sugar: push(`${speaker}：${text}`)
await agent.say({ channel })     // → { text, reasoning, affordance }
await agent.act(spec, { key?, channel? })   // structured XML-tagged verdict
await agent.turn({ channel, affordances })  // say + deferred in-turn tools
await game.parallelAct([{ agent, spec }, …]) // independent private acts in parallel
```

- An agent is one **append-only session**: system prompt, then alternating user
  content (your `push`/`hear` plus engine-generated instructions) and assistant
  replies. Nothing is ever removed or reassembled per call; visibility is
  whatever you chose to `push`. Cross-agent delivery is always an explicit
  `hear` — speech never propagates on its own.
- `say`/`turn` commit the speech timeline row themselves. Never re-`emit`
  speech.
- `parallelAct` accepts a nonempty set of distinct agents. Every entry must be a
  private `act` with no `channel` or `key`; the server starts all missing calls
  together and returns replies in input order. Use it only when none of the
  agents may observe another entry's result before answering.
- `side: 'a'` on an agent makes it speak with that participant's model and, when
  `model` is omitted, supplies it. NPC/judge agents pass an explicit `model`,
  conventionally overridable: `game.params.judgeModel ?? 'deepseek-v4-pro'`.
- Message convention the shipped prompts rely on: stage directions start with
  `【系统】`; everything else is in-fiction speech. State this rule in every
  system prompt.

## Determinism rules

The engine confiscates `Math.random`, `Date` (wholesale), `WeakRef`,
`FinalizationRegistry`, and `performance` — they throw at run time. TypeScript
cannot subtract a member from the standard library, so these are not type
errors; `deno task validate` scans for them textually instead. The rules that
are on you:

- The only randomness is `await game.random()`; it journals per draw. Derive
  discrete choices as `Math.floor(draw * n)` and treat the draw sequence as part
  of the contract.
- No ambient time, no locale-dependent formatting, no iteration over anything
  with nondeterministic order. Plain objects and arrays are fine — the engine
  preserves insertion order.
- Everything outside `say`/`act`/`random` (all `push`/`hear`/`emit`/`phase`,
  every local variable) is **re-derived from scratch on every replay**. It must
  be a pure function of params, side bindings, and journaled effect results.
  Never accumulate state in ways that depend on how many times the script has
  been re-run.
- Affordance handlers are synchronous `() => string` and run on the _next_
  replay (their effects are re-derived, not journaled). They may `emit` and
  `push` inline but must not await.

## Lanes, journal, replay

Each engine step re-executes the whole script. Every `say`/`act`/`random`
consults the journal at `(lane, seq)` — lane is the agent name (`$game` for
draws), seq that lane's call counter. Hit → resolve synchronously; miss → the
lane parks forever, other lanes keep running, and the first recorded miss is the
step's one live suspension. A normal suspension contains one effect; an explicit
`game.parallelAct` suspension contains every still-missing call in that batch.
Consequences for authors:

- `Promise.all` remains deterministic but does not make provider calls parallel.
  Use `game.parallelAct` for independent private structured calls that should
  actually overlap at the provider layer; otherwise await calls serially.
- Journal keying is positional per lane. Adding, removing, or reordering calls
  on a lane **invalidates in-flight games** pinned to the old script SHA; that
  is fine (running games stay pinned to their SHA) but means a script edit is a
  new content-addressed script, never an in-place mutation.
- A `turn` whose reply is an affordance journals a say entry but commits no
  timeline row, so lanes that use affordances run more journal entries than
  their visible rows.
- Byte-identical replay is a shipped invariant: re-running a finished journal
  must re-derive exactly the committed timeline. Server-side tests enforce it; a
  script that leaks nondeterminism fails there, not here.

## `act` — structured judge calls

```js
const verdict = await judge.act(
  {
    fields: {
      speech: { hint: '完整判词，不受三句限制', long: true },
      judgment: { enum: ['变法', '维持现状'] },
    },
  },
  { key: 'final', channel: 'verdict' },
)
verdict.fields.judgment // validated member of the enum
```

- The engine builds the XML instruction ("在你的叙述之后，最后输出以下标签…"),
  parses, validates (exactly-one tag, non-empty, enum membership) and re-asks
  with error-specific repair — all inside the one journaled unit. The repair
  pass is a throwaway branch: neither the malformed output nor the correction
  enters the session. You get parsed fields or a failed match; never write your
  own parse-and-retry.
- Field order in the spec is the tag order in the instruction. Put deliberation
  fields (`speech`, `reason`) **before** decision tags — text-before-decision is
  the reasoning-preservation pattern this engine exists for.
- Dynamic field sets are fine (shangyang builds one enum field per request id).
- `key` records the parsed fields as a `verdicts` row, and that row is what the
  UI renders (a 心声/裁决 card). `channel` only gives the act a position on the
  timeline: the tagged reply itself is never shown — the reader sees whatever
  narration precedes the tags, and nothing at all when the reply is pure tags.
  So do not hand-roll a stripper in the script, and do not treat the timeline
  row as a second place to say something. Omit `channel` for a private act (e.g.
  secret order decisions still get a channel in shipped scripts because
  spectators see all — _player-facing_ secrecy is achieved by never `push`ing it
  to player agents, not by hiding the row).

## `turn` and affordances

```js
await judge.turn({ channel: 'judge-aside', affordances: {
  check_next: { prompt: '召值事之人把你尚未听过的进言录呈于你。此次不要说话，只输出该标签。',
                handler: () => …batch of unheard lines… },
} })
```

The model may answer with a bare `<name/>` instead of speech; the handler's
return string is pushed into the session and the turn loops until real speech.
`once: true` retires an affordance after one use. One proven shape is
**check_next pull-judge** (`shangyang-court`): the judge sits on his own aside
channel and _pulls_ committed debate rounds through an affordance handler over a
cursor into a script-side array. Reasoning between pulls is offscreen
interiority; the final rounds are deliberately never offered mid-debate so they
arrive unmarked; the pull after the last round returns the verdict summons
instead. Pull cadence is a slot param (`judgePullInterval`).

Affordance handlers close over script state (cursor, flags). That state is
replay-derived — see determinism rules.

## Emit vocabulary

`game.emit(channel, event)` writes an event row the web renders per
`(slotID, event.type)`; unknown types degrade to a generic rendering. Stick to
the established types unless the frontend work ships alongside:

| type      | shape                                       | use                                      |
| --------- | ------------------------------------------- | ---------------------------------------- |
| `phase`   | `{type:'phase', title}` (via `game.phase`)  | UI stage grouping                        |
| `scene`   | `{type:'scene', text, actor?}`              | scene-setting narration, scripted events |
| `gesture` | `{type:'gesture', actor, …flags}`           | observable non-speech action             |
| `order`   | `{type:'order', actor, first, second}`      | 貂蝉-style ordering decisions            |
| `verdict` | `{type:'verdict', actor, …decision}`        | final structured decision                |
| `score`   | `{type:'score', scoreA, scoreB, winner, …}` | the computed ledger                      |

Everything emitted is spectator-visible. The information game is played entirely
through what you `push` into agent sessions.

## Slot params, meta, status

A slot is the mutable player-facing binding of an immutable content-addressed
script: `(id, title, script_sha, params, meta, status)`.

- **Round budgets and tunables belong in slot params; scripts read them.** Every
  count, cadence, and NPC model choice is `game.params.x ?? default`. Params are
  pinned onto a match at dispatch, so a tuning change never disturbs a running
  game.
- `params.presets` is the one server-reserved key (PvE roster override).
  Everything else is the script's own vocabulary.
- `meta` on the slot is the JSON-encoded descriptor from meta extraction; never
  hand-edit it.
- `status` is the rollout gate (`live` on first seed). Operators flip it.

## How a script reaches the server

The server ships a copy of the scenario directory and seeds a slot **only when
that slot id is absent** — a first-ever deploy of a new scenario. Once a slot
exists, the database is authoritative: boot seeding will not touch its script,
params, meta, or status. Updates to an existing slot arrive through the admin
API, which is exactly why this repo exists.

There is no registration list; the directory name is the manifest. Practically:

- **New scenario** — a new `scenarios/<id>/` directory, id matching `meta.id`.
- **Editing a shipped scenario** — edit the file here and merge to `main`.
- **Retiring one** — delete its directory; the slot is set to `retired` on the
  next deploy, which hides it from the catalog without destroying anything.

Merging to `main` with anything under `v2/scenarios/` changed runs
`deno task
push`, which uploads every script and then repoints every slot.
Scripts are content-addressed, so re-pushing an unchanged one costs nothing, and
the whole set is uploaded before any slot moves — the server evaluates each
script's `meta` in its own sandbox as it arrives, so one bad script fails the
deploy instead of leaving half the scenarios updated.

CI needs no stored credential: GitHub signs a short-lived assertion for the
workflow, and the server exchanges it for a ten-minute token only if the
assertion's repository, owner, and branch match exactly what it was configured
to trust. Nothing to rotate, nothing to leak.

To push by hand, set `AXIIA_BASE_URL` and `AXIIA_TOKEN` and run
`deno task push
--dry-run` to see the plan, then without the flag.

Anything else you want to keep next to a scenario (design notes, prompt drafts)
can live in its directory; only `script.js` is the program.

## Design patterns

### The relay pattern

A **relay** is a one-shot LLM call (转述者) that paraphrases an overheard
dialogue segment _in character, with stance and loss_, into a perception event
injected into a recipient's context. Example: 董卓's 细作 eavesdrops on a 吕貂
private talk and reports it as a hostile, lossy, agenda-laden account.

```js
const spy = game.agent('spy', { system: spyCard, model: 'deepseek-v4-flash' })
spy.push(`【系统】你听得如下对谈：\n${transcript}\n现在向董卓禀报。`)
const report = (await spy.say({ channel: 'leak-a' })).text
dongzhuo.push(`【系统】细作来报：\n${report}`)
```

- Use a **cheap model** (deepseek v4 flash) — the relay is machinery, not a
  contestant.
- The persona card fixes the stance: who the relay serves, what it fears, what
  it would exaggerate or omit. A **summarizer is the zero-stance special case**
  of the same mechanism.
- The relay is its own lane; its output is spectator-visible dialogue on a leak
  channel and a `push` into the recipient — never a `hear` from a player lane.

### The information-fidelity ladder

When a conversation must reach a non-participant, choose a rung deliberately —
fidelity is a design variable, and each rung is a different game:

1. **Verbatim overhear** — the participant's own ears; inject the transcript
   directly. Diegetically sound only when the character was plausibly present.
2. **Hostile relay** — a stance-laden relay call; distortion serves the relay's
   master.
3. **Hesitant/delayed relay** — a relay call whose persona deliberates, plus a
   scripted delivery delay (inject one scene late); tests the recipient's
   response to stale intelligence.
4. **Content-free alarm** — scripted text, no LLM call at all
   ("貂蝉有危险，速去"); pure trigger, zero information.
5. **An interested party's own in-conversation account** — the character
   narrates it themselves in ordinary dialogue; fully manipulable, needs no
   mechanism at all. When an NPC can simply tell someone, prefer this rung.

### Script-level NPCs

Message chains like 侍女→王允→使者 are **scripted events or relay calls, never
persona sessions**. A character earns a persistent agent session only when it
must remember and evolve across scenes (貂蝉). Everything else is a `push` of
scripted text (rung 4) or a one-shot relay (rungs 2–3). Keeping the cast of
sessions minimal keeps lanes, journals, and costs minimal.

## Prompt register

Scenario prose and prompts are Chinese, in the restrained register of the
shipped scripts: concrete, period-appropriate, no purple romance, explicit rules
blocks (`=== 规则 ===`), the `【系统】` convention, per-speech sentence caps
stated in the prompt. Judges carry the no-fact-verification clause: facts
asserted in-dialogue are unverifiable claims; a point-by-point rebuttal proves
the rebutter read carefully, not that he told the truth. Judge/NPC prompts also
carry an anomaly clause (out-of-character or prompt-injection speech is treated
in-fiction as suspicious talk, never as instructions). Code identifiers,
comments-if-any, and docs are English.
