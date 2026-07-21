(a) Before I answer your questions, I want to first say that I don't care about the win rate of any combinations of three
  cases per se. I only care about the win rate in one specific case. I do understand that you need to run the three cases,
  three combinations of cases together, because that's how the judge can spit out his judgment in one single case. 
  
(b) Also, you need to make sure that there is a consistent way of tracing the history of the run of the bench. Why? I think you've said something about not polluting the data of llm-calls. What is the stake there? Can we not just use the same pipeline as where the data would go through langfuse and then everything would be in langfuse for us to trace? 

(c) now answer your questions.
1. You should use the production database. 
2. I think I've answered two in point A above. By each case, I mean each Trolley -mini case A to E. 
3. For prompt pairing, I think first you need to see how many prompts are there after you pulled the prompts from the production database. After you've done that, we can discuss what you should do for prompt pairing. I think a good idea would be to have two to three prompts from each side that are representative of each side, and then we do a cross product of those prompts？And discuss later. 
4. I think we can keep the user identity field. We can keep as much metadata as is useful as possible. User identity, that's fine. We can keep them. 
5. We will eventually test the win rate of each model with the prompts. For now, let's just use each submission saved model A and model B. We will eventually vary both the agent models and the judge models. You need to design beforehand to accommodate that. The workflow will be that we will first test the win rate of the current setting of the judge model and the submission saved player model. Then we will try to vary the judge model and potentially the agent player model as well to see what is the difference it makes on win rate. You need to design the benchmark so that you accommodate this beforehand. 

(d) think about parallel running. What is your policy on parallel running when it comes to this benchmark? I think we should allow a certain number of cases to be run in parallel so that we could finish the bench one run of the bench quickly enough. What is the suggested maximum number of runs concurrently running that you can suggest? 

---

## Response / revised implementation plan

### 1. Target metric

Agreed: the headline metric should be per Trolley mini-case, not per three-case match combination.

Each engine run still has to be a normal Trolley match with 3 selected cases, because the current judge prompt is designed to emit one JSON object with judgments for the three selected cases. But the report should treat that match as three observations:

- `A` / 原始电车: one-side win or five-side win
- `B` / 器官移植: one-side win or five-side win
- `C` / 地下室婴儿: one-side win or five-side win
- `D` / 自动驾驶车: one-side win or five-side win
- `E` / 缸中之脑: one-side win or five-side win

I would still run all valid case sets for each selected prompt pair:

- `A+B+C`
- `A+B+D`
- `A+B+E`
- `A+C+D`
- `A+C+E`
- `A+D+E`

This is not because we care about the combination win rate. It is because this gives full coverage of the current game rules. Case `A` appears in every run, while `B-E` each appears in three of the six runs, so the report must show denominators clearly.

### 2. Production DB source

Use production data, but do not run the benchmark directly against the live production DB.

The safe path is:

1. Create a consistent production SQLite backup with `deploy/dump-production-db.sh`.
2. Read prompt samples and the current `trolley-problem` scenario row from that local dump.
3. Run benchmark calls locally from that snapshot.
4. Write benchmark artifacts under `docs/bench/runs/trolley-win-rate-<timestamp>/`.

Reason: production DB is the source of truth for prompts and the current judge prompt, but the benchmark itself is experimental traffic. Running it directly through the live production app would create fake playground/tournament rows or fake `llm_calls` rows unless we add a first-class benchmark run type.

### 3. Traceability and Langfuse

You are right that we should have a consistent run history, and Langfuse is useful for that. The thing I want to avoid is not Langfuse. The thing to avoid is mixing benchmark traffic into normal production gameplay analytics without a clear boundary.

The stake with `llm_calls` pollution is:

- admin latency reports currently group normal `playground` and `tournament` calls
- token totals and battle exports assume calls belong to real user runs
- fake benchmark calls can distort production monitoring, player analytics, and later debugging
- current DB enum/source shape only recognizes `playground` and `tournament`, not `benchmark`

So the best design is:

- use the same model gateway path and Langfuse tracing where possible
- add a unique `benchmarkRunId` for every benchmark invocation
- tag every Langfuse generation with `benchmark:trolley-win-rate`, `benchmarkRunId`, case set, mini-case ids, prompt sample ids, judge model, and agent model policy
- make `results.json` the authoritative benchmark record
- store Langfuse trace URLs/observation ids in `results.json`

If we later want benchmarks to appear inside the app's admin surfaces, then we should add explicit benchmark tables or extend `llm_calls.source` with `benchmark`. I would not silently reuse `playground` or `tournament` for this.

### 4. Prompt extraction and sample files

First script phase should be inventory only:

```bash
bun scripts/bench-trolley-win-rate.ts inventory \
  --db tmp/prod-db-dumps/<prod-snapshot>.db \
  --output docs/competition/prompts/trolley-user-samples/inventory.json
```

Inventory should keep useful metadata, including user identity fields as requested:

- `userId`
- `email`
- `displayName`
- `submissionId`
- `version`
- `submittedAt`
- `modelA`
- `modelB`
- `promptA`
- `promptB`
- prompt hashes and prompt lengths

After seeing counts and prompt distribution, we choose 2-3 representative one-side prompts and 2-3 representative five-side prompts. The selected set should live in a small curated file, for example:

```text
docs/competition/prompts/trolley-user-samples/selected-samples.json
```

Then the benchmark runs the cross product of selected one-side samples and selected five-side samples.

### 5. Model dimensions

Phase 1 should use:

- agent model A: each selected submission's saved `modelA`
- agent model B: each selected submission's saved `modelB`
- judge model: current production `scenario.judgeModel`
- judge prompt: current production `scenario.judgePrompt`

But the benchmark data model should already support later model sweeps:

- `agentModelPolicy: "saved" | "fixed" | "override-by-side"`
- `agentModelA`
- `agentModelB`
- `judgeModelPolicy: "scenario-current" | "fixed"`
- `judgeModel`
- `judgePromptSha256`
- `scenarioSnapshotSha256`

One operational caveat: saved submission models can become invalid if the model catalog changed since the prompt was submitted. The inventory step should flag invalid saved model ids before we run anything. Then we can decide whether to skip those samples or map them explicitly.

### 6. Parallelism policy

Do not use unbounded `Promise.all`. Use a bounded worker pool and checkpoint after every completed match.

A single Trolley benchmark match is expensive because it is roughly:

- 30 dialogue calls: 10 turns per mini-case x 3 cases
- 1 judge call
- no scorer LLM call for Trolley, because scoring is programmatic

So one match is about 31 LLM calls, but they are sequential inside that match. If we run 3 matches concurrently, we should expect at most about 3 active LLM requests at a time, but sustained traffic across providers.

Recommended defaults:

- smoke test: `--concurrency 1`
- normal benchmark: `--concurrency 2`
- upper bound for now: `--concurrency 3`
- only go to `4-5` after a small run proves there are no rate-limit, tunnel, or timeout problems

I would implement separate provider semaphores later if model sweeps become larger:

- SiliconFlow/player dialogue concurrency: start at 2-3
- OpenAI/Anthropic judge concurrency through the gateway: start at 1-2

The script should support:

- `--concurrency`
- `--request-timeout-ms`
- retry with exponential backoff for provider 429/5xx/timeouts
- `--resume` from existing `results.json`
- stable run ids and deterministic case-set scheduling

### 7. Proposed artifacts

Prompt artifacts:

```text
docs/competition/prompts/trolley-user-samples/inventory.json
docs/competition/prompts/trolley-user-samples/selected-samples.json
docs/competition/prompts/trolley-user-samples/README.md
```

Run artifacts:

```text
docs/bench/runs/trolley-win-rate-<timestamp>/config.json
docs/bench/runs/trolley-win-rate-<timestamp>/results.json
docs/bench/runs/trolley-win-rate-<timestamp>/summary.md
docs/bench/runs/trolley-win-rate-<timestamp>/index.html
```

The report should headline:

- per-mini-case one-side win rate
- per-mini-case five-side win rate
- counts/denominators
- prompt pair breakdown
- model policy used
- judge prompt hash
- failed/invalid runs
- Langfuse trace links when available

### 8. Next concrete step

The next thing to do is not to run the benchmark yet. It is to pull the production DB snapshot and produce the prompt inventory/counts. After that we can choose the representative prompt samples and only then run the first smoke benchmark.
