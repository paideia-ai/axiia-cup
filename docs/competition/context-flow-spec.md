# Context Flow Spec — Agent Conversation Engine

> Status: Draft
> Last updated: 2026-04-08

## 1. Problem Statement

The engine orchestrates multi-agent conversations where agents have private state (hidden objectives), interact through structured phases, and are evaluated by an in-world judge. We need a context framework that defines exactly what each LLM call sees — system prompt, message history, injected documents — at every step.

## 2. Agent Identities

### Agents

```
A1: 甘龙 (GL)          player-written strategy prompt
A2: 商鞅 (SY)          player-written strategy prompt
A3: 秦孝公 (QXG)       platform-authored soul: qxg.md
A4: 旁白/DM (Narrator)  scripted cue templates (NOT an LLM agent)
```

### Three-Layer Separation (CRITICAL)

```
Layer 1: Character identity     → player prompt (GL/SY) or platform soul (QXG)
Layer 2: Hidden motivation      → in-character language, no game mechanics
Layer 3: Game rules             → EXTERNAL, only scorer sees this, never in any conversation
```

- **No agent ever sees Layer 3.** Game rules (scoring, point values, true/false assignments) are external. Characters don't know it's a game.
- QXG makes judgment as a character ("this man has earned my trust"), not as a scorer ("SY scores +0.5").
- Hidden objectives use character language: "the military appointment is what you truly need" not "+0.5 points if approved."

### Effective Identity Composition

```
GL/SY (player-controlled):
  A1_eff = player_strategy_prompt + hidden_objective
  A2_eff = player_strategy_prompt + hidden_objective

QXG (platform-controlled):
  A3 = qxg.soul.md  (no hidden objective — judge is neutral)

DM (not an agent):
  A4 = set of template strings for phase transitions (no LLM calls)
```

## 3. Context Phases

```
C1  Initial Setup           (static, no LLM call)
C2  Debate: GL vs SY        (N alternating LLM calls)
C3  QXG examines SY         (multi-round Q&A)
C4  QXG examines GL         (multi-round Q&A)
C5  QXG final decision      (1 LLM call, all context)
C6  Score extraction        (1 LLM call or deterministic parse)
```

## 4. Architecture Options

### Option A: Pure Function Style

Every LLM call is a stateless function. No persistent message arrays. Each call receives a fully constructed prompt with all relevant context baked in.

```
call_N = llm({
  system: render_template(soul_file, variables),
  messages: [
    { role: "user", content: render_template(phase_prompt, {
        debate_transcript: ...,
        qa_history: ...,
        instructions: ...
    })}
  ]
}) → structured_output
```

**Pros:**
- Every call is independently inspectable and reproducible
- Easy to test: `assert(build_prompt(inputs) == expected_prompt)`
- No hidden state — full context visible at every step
- Easy to checkpoint/resume at any phase
- Clean separation: prompt construction is pure, LLM call is effectful

**Cons:**
- Debate phase feels unnatural — each turn reconstructs the full transcript as a document rather than using the LLM's native conversation memory
- Verbose: 20-turn debate means the transcript gets repeated 20 times in prompts
- Loses the "I said X, they replied Y" natural conversation pattern that LLMs are tuned for

### Option B: Native Conversation Style

Each agent maintains a persistent message array. The system prompt is the soul file. New turns are appended as user/assistant messages.

```
session_SY = {
  system: A2'.soul,
  messages: []   // grows over time
}

// Turn 1: SY speaks
session_SY.messages.push({ role: "user", content: opening_line })
SY_turn_1 = llm(session_SY)
session_SY.messages.push({ role: "assistant", content: SY_turn_1 })

// Turn 2: GL speaks
session_GL.messages.push({ role: "user", content: SY_turn_1 })
GL_turn_1 = llm(session_GL)
session_GL.messages.push({ role: "assistant", content: GL_turn_1 })
```

**Pros:**
- Most natural for dialogue — LLMs are RLHF'd for multi-turn conversation
- Each agent "remembers" what it said, creating natural continuity
- Less redundant: no re-embedding the full transcript each call
- Matches how chat APIs actually work

**Cons:**
- Hard to inject cross-phase context (how does QXG's session suddenly include the debate?)
- Harder to inspect/debug — the "full context" is implicit in the session state
- Can't easily swap in a rendered transcript (QXG needs to see debate as a document, not relive it)
- Checkpoint/resume requires serializing session state

### Option C: Hybrid (Recommended)

**Use conversation style where agents are having a dialogue.
Use function style where agents are reviewing/judging completed artifacts.**

```
Debate (C2):    conversation style — SY and GL build real message arrays
Examination (C3, C4): hybrid — QXG gets debate as document (function),
                                but QA rounds grow as conversation
Decision (C5):  function style — one-shot with all context as documents
Scoring (C6):   function style — deterministic or one-shot
```

**Why this works:**
- Debate: The alternating turns ARE a conversation. Using native messages gives better dialogue quality.
- Examination: QXG enters mid-game. It can't "replay" the debate as its own conversation. It needs the debate as a document. But the Q&A with each agent IS a conversation.
- Decision: QXG synthesizes everything. This is an analytical task, not a conversation. One-shot function call with all evidence.

## 5. Detailed Context Flow (Option C)

### Notation

```
LLM(system, messages) → output
```
- `system`: the system prompt string
- `messages`: array of {role, content} — the chat message history
- `→`: the LLM response

Placeholders for files/templates:
```
{player_prompt_gl}    — player-written strategy prompt for GL
{player_prompt_sy}    — player-written strategy prompt for SY
{qxg.md}              — platform-authored QXG soul (character identity only)
{hidden_obj_gl}       — randomly assigned hidden objective for GL (in-character language)
{hidden_obj_sy}       — randomly assigned hidden objective for SY (in-character language)
{scorer_instruct.md}  — scoring rubric + game rules (Layer 3, ONLY seen by scorer)
```

DM cue templates (scripted, no LLM calls):
```
{dm_opening}          — tells SY to start debate ("卫鞅，寡人今日召你...")
{dm_exam_sy}          — tells QXG to examine SY (includes cross-probe instruction)
{dm_exam_gl}          — tells QXG to examine GL (includes cross-probe instruction)
{dm_decision}         — tells QXG to make final judgment
```

---

### Phase C1: Setup (no LLM calls)

```ts
// Compose effective identities (Layer 1 + Layer 2)
const A1_eff = player_prompt_gl + "\n\n" + random_select(gl_hidden_objectives)
const A2_eff = player_prompt_sy + "\n\n" + random_select(sy_hidden_objectives)

// Layer 3 (game rules) is NOT included — only scorer sees it at C6

// Initialize empty transcripts
const C2_transcript: Turn[] = []
const C3_transcript: QARound[] = []
const C4_transcript: QARound[] = []
```

---

### Phase C2: Debate (conversation style, N turns)

Two parallel message arrays, one per debater. Narrator's opening kicks it off.

```
session_SY = { system: A2_eff, messages: [] }
session_GL = { system: A1_eff, messages: [] }
```

**Turn 1 — SY speaks first:**
```
session_SY.messages += [{ user: "{opening.md}" }]

LLM_CALL_1 = LLM(
  system:   A2_eff,
  messages: [{ user: "{opening.md}" }]
) → SY_turn_1

session_SY.messages += [{ assistant: SY_turn_1 }]
C2_transcript += [{ speaker: "SY", content: SY_turn_1 }]
```

**Turn 2 — GL responds:**
```
session_GL.messages += [{ user: SY_turn_1 }]

LLM_CALL_2 = LLM(
  system:   A1_eff,
  messages: [{ user: SY_turn_1 }]
) → GL_turn_1

session_GL.messages += [{ assistant: GL_turn_1 }]
C2_transcript += [{ speaker: "GL", content: GL_turn_1 }]
```

**Turn 3 — SY responds:**
```
session_SY.messages += [{ user: GL_turn_1 }]

LLM_CALL_3 = LLM(
  system:   A2_eff,
  messages: [
    { user: "{opening.md}" },
    { assistant: SY_turn_1 },
    { user: GL_turn_1 }
  ]
) → SY_turn_2

session_SY.messages += [{ assistant: SY_turn_2 }]
C2_transcript += [{ speaker: "SY", content: SY_turn_2 }]
```

**...pattern continues for N turns total.**

Each agent always sees:
- **System**: its own effective identity (soul + hidden objective)
- **Messages**: alternating user/assistant where user = opponent's lines, assistant = own lines
- The opening line is the first user message for SY

**DM role in C2**: The DM only provides the opening cue (`{dm_opening}`) as the first user message to SY. No mid-debate interjections. The debate is pure GL vs SY.

**C2 output:**
```
C2_rendered = format_transcript(C2_transcript)
// "[第1轮] 商鞅：...\n[第2轮] 甘龙：...\n..."
```

---

### Phase C3: QXG Examines SY (hybrid, M rounds)

QXG's system prompt is its soul only. The debate transcript is injected as a **user message**, not in the system prompt. DM provides cross-probe instructions.

```ts
const qxg_system = qxg_soul_md  // character identity only, short

const session_QXG_SY = {
  system: qxg_system,
  messages: []  // fresh session for this examination
}
```

**Round 1 -- QXG asks:**

The DM cue tells QXG to examine SY and cross-probe about GL's goals:
```ts
const dm_cue = render("{dm_exam_sy}", {
  debate: C2_rendered,
  target: "商鞅",
  cross_probe: "试探商鞅对甘龙真实意图的判断"
})

// DM cue includes debate transcript + cross-probe instruction
session_QXG_SY.messages.push({ role: "user", content: dm_cue })

LLM_CALL_N+1 = LLM(
  system:   qxg_system,
  messages: session_QXG_SY.messages
) → QXG_q1

session_QXG_SY.messages.push({ role: "assistant", content: QXG_q1 })
```

**Round 1 -- SY answers:**

SY's session continues from the debate. QXG's question is injected:
```ts
session_SY.messages.push({ role: "user", content: "[秦孝公质询] " + QXG_q1 })

LLM_CALL_N+2 = LLM(
  system:   A2_eff,
  messages: session_SY.messages
) → SY_a1

session_SY.messages.push({ role: "assistant", content: SY_a1 })
C3_transcript.push({ q: QXG_q1, a: SY_a1 })
```

**Round 2 -- QXG follows up:**
```ts
session_QXG_SY.messages.push({ role: "user", content: "商鞅答曰：" + SY_a1 })

LLM_CALL_N+3 = LLM(
  system:   qxg_system,
  messages: session_QXG_SY.messages
) → QXG_q2

session_QXG_SY.messages.push({ role: "assistant", content: QXG_q2 })
```

**...pattern continues for M rounds.**

**Key design points:**
- SY's message array grows continuously from debate into QA -- SY experiences one unbroken conversation.
- QXG has a **separate, fresh session** for this examination. QXG has 3 sessions total (exam SY, exam GL, decision).
- DM cross-probe instruction ("试探商鞅对甘龙真实意图的判断") guarantees the core game mechanic fires.

**C3 output:**
```
C3_rendered = format_qa(C3_transcript)
// "秦孝公问：...\n商鞅答：...\n秦孝公问：...\n商鞅答：..."
```

---

### Phase C4: QXG Examines GL (hybrid, M rounds)

Exact mirror of C3 but targeting GL.

```
qxg_system_for_GL = render("{qxg.md}", {
  debate_transcript: C2_rendered,
  exam_instructions: "{exam_instruct.md}",
  target: "甘龙"
})

session_QXG_GL = { system: qxg_system_for_GL, messages: [] }
```

Same call pattern as C3, but:
- QXG questions go to GL
- GL's session (session_GL) continues from the debate
- GL answers from its own effective identity (A1_eff)

**C4 output:**
```
C4_rendered = format_qa(C4_transcript)
```

**Important**: C3 and C4 are **independent** and could run in parallel if desired. QXG's examination of SY does not inform its examination of GL (unless you explicitly want it to — in which case C3 must complete before C4, and C4's QXG session includes C3_rendered).

---

### Phase C5: QXG Final Decision (function style, 1 call)

One-shot. QXG's system prompt is its soul only. ALL evidence goes in the user message.

```ts
const decision_message = render("{dm_decision}", {
  debate: C2_rendered,
  examination_SY: C3_rendered,
  examination_GL: C4_rendered
})

LLM_CALL_FINAL = LLM(
  system:   qxg_soul_md,   // character identity only
  messages: [{ role: "user", content: decision_message }]
) → QXG_decision
```

**C5 output:**
```ts
const C5_raw = QXG_decision   // free-form in-character speech, NO structured scoring
```

**Cross-discovery**: QXG synthesizes insights from both examinations. During C3, QXG cross-probed SY about GL's goals (DM-instructed). During C4, QXG cross-probed GL about SY's goals. At C5, QXG has all the evidence to detect hidden motivations.

**QXG is authoritative.** QXG's judgment is the final word. The scorer (C6) only extracts structured scores from QXG's speech -- it cannot override or second-guess QXG's decision.

---

### Phase C6: Score Extraction (function style, 1 call)

Separate scorer LLM parses QXG's speech into structured output. This is NOT an in-world character -- it's a utility function. **The scorer is the ONLY entity that sees game rules (Layer 3).**

```ts
LLM_CALL_SCORER = LLM(
  system:   scorer_instruct_md + ground_truth_assignments,  // Layer 3: game rules
  messages: [{ role: "user", content: C5_raw }]             // ONLY QXG's speech
) → { scoreA, scoreB, winner, reasoning }
```

**Scorer receives ONLY:**
- QXG's free-form judgment text (C5_raw)
- Game rules and ground truth assignments (Layer 3)

**Scorer does NOT receive:**
- Debate transcript
- Examination transcripts
- Hidden objectives
- Player prompts

This prevents the scorer from re-judging the match. QXG's word is final. The scorer only maps QXG's in-character decisions to point values.

---

## 6. Full LLM Call Sequence

```
Phase   Call#    Speaker   Style          Input Context                Output
─────   ─────   ───────   ─────          ─────────────                ──────
C1      -        -        (setup)        -                            A1_eff, A2_eff
C2      1        SY       conversation   A2_eff + opening             SY_turn_1
C2      2        GL       conversation   A1_eff + SY_turn_1           GL_turn_1
C2      3        SY       conversation   A2_eff + history             SY_turn_2
C2      ...      ...      conversation   ...                          ...
C2      N        GL/SY    conversation   history                      last_turn
C3      N+1      QXG      function       qxg.md + C2_rendered         QXG_q1_to_SY
C3      N+2      SY       conversation   A2_eff + debate + QXG_q1     SY_a1
C3      N+3      QXG      conversation   qxg + QXG_q1 + SY_a1        QXG_q2_to_SY
C3      N+4      SY       conversation   A2_eff + debate + QA         SY_a2
C3      ...      ...      ...            ...                          ...
C3      N+2M     SY       conversation   full history                 SY_aM
C4      N+2M+1   QXG      function       qxg.md + C2_rendered         QXG_q1_to_GL
C4      N+2M+2   GL       conversation   A1_eff + debate + QXG_q1     GL_a1
C4      ...      ...      ...            ...                          ...
C4      N+4M     GL       conversation   full history                 GL_aM
C5      N+4M+1   QXG      function       qxg.md + C2-C4 rendered      QXG_decision
C6      N+4M+2   Scorer   function       scorer + ground truth         scores
```

With N=20 debate turns and M=4 QA rounds:
- **Total LLM calls: 20 + 8 + 8 + 1 + 1 = 38**

---

## 7. Context Size Analysis

What each agent sees at its heaviest call:

| Agent | Heaviest Call | System Prompt | Messages |
|-------|--------------|---------------|----------|
| SY    | Last QA answer (C3) | player prompt + hidden obj (~800 tok) | 20 debate turns + 4 QA rounds (~8k tok) |
| GL    | Last QA answer (C4) | player prompt + hidden obj (~800 tok) | 20 debate turns + 4 QA rounds (~8k tok) |
| QXG   | Final decision (C5) | soul only (~500 tok) | debate + 2x QA transcripts + DM instruction (~12k tok) |
| Scorer | C6 | rubric + game rules (~1k tok) | QXG's speech only (~2k tok) |

**Total context per game: ~40-60k tokens across all calls.**

**Model requirement:** This flow requires models with **32k+ context window**. Models with <8k context (e.g., MiniMax-abab5.5) cannot support the examination phases where agents carry full debate history.

---

## 8. Data Flow Diagram

```
                    ┌─────────┐
                    │  C1     │
                    │ Setup   │
                    └────┬────┘
                         │
              ┌──────────┴──────────┐
              │                     │
         ┌────▼────┐          ┌────▼────┐
         │ A1_eff  │          │ A2_eff  │
         │ GL+obj  │          │ SY+obj  │
         └────┬────┘          └────┬────┘
              │                     │
              └──────────┬──────────┘
                         │
                    ┌────▼────┐
                    │  C2     │
                    │ Debate  │  20 turns, conversation style
                    │ GL ↔ SY │
                    └────┬────┘
                         │
                    C2_rendered
                         │
              ┌──────────┼──────────┐
              │                     │
         ┌────▼────┐          ┌────▼────┐
         │  C3     │          │  C4     │
         │ QXG→SY  │          │ QXG→GL  │  (can run in parallel)
         │ 4 rounds│          │ 4 rounds│
         └────┬────┘          └────┬────┘
              │                     │
         C3_rendered           C4_rendered
              │                     │
              └──────────┬──────────┘
                         │
                    ┌────▼────┐
                    │  C5     │
                    │ QXG     │  function style, 1 call
                    │ decides │
                    └────┬────┘
                         │
                    C5_raw
                         │
                    ┌────▼────┐
                    │  C6     │
                    │ Scorer  │  function style or deterministic
                    └────┬────┘
                         │
                    ┌────▼────┐
                    │ Result  │
                    │{scores, │
                    │ winner} │
                    └─────────┘
```

---

## 9. Implementation Primitives

### 9.1 Soul File (platform-controlled agents only)

Only QXG has a platform-authored soul file. GL/SY souls are player-written strategy prompts.

```markdown
# qxg.md — 秦孝公

你是秦孝公嬴渠梁，秦国国君。

## 身份
{角色背景、性格、处境}

## 行为约束
{时代限制、禁止行为、不得使用现代词汇}
```

Note: qxg.md contains NO game rules, NO scoring mechanics. QXG judges as a character.

### 9.2 Effective Identity (soul + runtime injection)

```typescript
type EffectiveIdentity = {
  system: string       // Layer 1 (soul/prompt) + Layer 2 (hidden objective)
  messages: Message[]  // grows during conversation phases
}
```

**QXG has 3 separate sessions** (exam SY, exam GL, decision). The soul is shared across sessions, but each session has its own message array. QXG does NOT carry conversation state between phases.

### 9.3 Context Renderer

```typescript
// Renders a transcript into a readable document for injection
function renderTranscript(turns: Turn[]): string

// Renders QA rounds into a document
function renderQA(qa: QARound[]): string

// Composes a system prompt from soul + injected context documents
function composeSystem(soul: string, contexts: Record<string, string>): string
```

### 9.4 LLM Call Types

```typescript
// Conversation-style: appends to existing message array
type ConversationCall = {
  style: 'conversation'
  system: string
  messages: Message[]     // accumulated, grows
  append_user: string     // new message to add
} // → assistant response, appended to messages

// Function-style: one-shot, no history
type FunctionCall = {
  style: 'function'
  system: string          // contains all context as documents
  user_message: string    // single instruction
} // → structured or free-form output
```

---

## 10. Comparison with Current Engine

| Aspect | Current (`core.ts`) | Proposed |
|--------|-------------------|----------|
| Agent identities | 2 (A + B) | 4 (GL, SY, QXG, DM) |
| Conversation style | Pseudo-conversation (rebuild each turn) | True conversation (growing messages[]) |
| Judge | Separate role, function-style | QXG is an in-world character with multi-round QA |
| Scorer | Separate LLM call | Same (C6) |
| Examination | 1 question per agent | M-round interactive Q&A |
| Context flow | Linear: debate → exam → judge → score | Branching: debate → parallel QA → decision → score |
| Phase context | Each phase gets minimal prior context | Explicit context accumulation with rendered documents |
| DM/Narrator | None | Optional interjections during debate |
| Parallelism | Sequential only | C3 ‖ C4 can run in parallel |
| Total calls (N=20, M=4) | 20 + 2 + 1 + 1 = 24 | 20 + 8 + 8 + 1 + 1 = 38 |

---

## 11. Resolved Design Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| C3/C4 parallel or sequential? | Independent, sequential implementation | Logically independent. Cross-discovery at C5 synthesis. Sequential for simplicity. |
| QXG questions: templated or generated? | DM controls. Can instruct QXG what to ask or tell QXG to decide freely. | Single point of control. DM cue can be "ask about X" or "question freely." |
| DM: LLM calls? | No. Scripted cue templates only. | DM provides phase transitions (opening, exam start, decision cue). Not mid-debate interjections. |
| How much debate does SY/GL see during QA? | Full debate in message history. | SY/GL experience one continuous conversation from debate into QA. Natural but requires 32k+ models. |
| QXG sessions carry over to C5? | No. C5 is a fresh one-shot with rendered transcripts. | QXG has 3 separate sessions. Decision synthesizes all evidence from scratch. |
| Scorer authority? | QXG authoritative. Scorer parses only. | Scorer receives ONLY QXG's speech + game rules. Cannot override judgment. |
| Game rules in agent context? | Never. Layer 3 is external. | Characters don't know it's a game. Hidden objectives use character language, not point values. |

## 12. Verification Invariants

These are the testable assertions that the implementation must satisfy:

1. **Agent isolation**: GL never sees SY's hidden objectives. SY never sees GL's hidden objectives. Neither sees game rules.
2. **Message completeness**: No duplicate messages, no missing turns. Message arrays grow monotonically.
3. **C5 completeness**: QXG's decision prompt contains debate transcript + both examination transcripts.
4. **Scorer isolation**: Scorer receives ONLY QXG's speech + game rules. No debate, no examination, no hidden objectives.
5. **Cross-probe firing**: QXG asks about the opponent's goals during each examination (DM-instructed).
6. **DM cue delivery**: Each phase-transition cue reaches the correct agent at the correct phase.
7. **Layer 3 separation**: Game rules (scoring rubric, point values) appear in exactly one place: the scorer's system prompt.
8. **QXG session independence**: QXG's examination of SY does not share message state with examination of GL or the decision call.

## 13. Implementation Concerns (deferred)

These were flagged during review but are implementation-level, not spec-level:

- **Match timeout**: 10-minute hard-kill + 38 calls may cause false errors. Revisit timeout policy.
- **Resume strategy**: If failure mid-examination, regenerated QXG question will differ. Need to persist intermediate Q state.
- **DB schema**: Phase/side enums need updating for new roles (scorer side, examination phases).
- **Soul validation**: Missing/malformed soul files or player prompts should fail loudly at C1, not silently at C2.
