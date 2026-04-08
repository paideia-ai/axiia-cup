# Context Flow Spec — Agent Conversation Engine

> Status: Draft
> Last updated: 2026-04-08

## 1. Problem Statement

The engine orchestrates multi-agent conversations where agents have private state (hidden objectives), interact through structured phases, and are evaluated by an in-world judge. We need a context framework that defines exactly what each LLM call sees — system prompt, message history, injected documents — at every step.

## 2. Agent Identities

Each agent has a **soul file** — a static identity document. Hidden objectives are appended at runtime to produce the agent's **effective identity**.

```
A1: 甘龙 (GL)          soul: gl.md
A2: 商鞅 (SY)          soul: sy.md
A3: 秦孝公 (QXG)       soul: qxg.md
A4: 旁白/DM (Narrator)  soul: dm.md
```

```
A1' = A1.soul + random_hidden_objective(GL)
A2' = A2.soul + random_hidden_objective(SY)
A3  = A3.soul  (no hidden objective — judge is neutral)
A4  = A4.soul  (narrator is system-controlled, may not need LLM calls)
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
{gl.md}           — GL soul file (static identity, personality, goals)
{sy.md}           — SY soul file
{qxg.md}          — QXG soul file
{dm.md}           — Narrator soul file
{hidden_obj_gl}   — randomly assigned hidden objective for GL
{hidden_obj_sy}   — randomly assigned hidden objective for SY
{opening.md}      — narrator's opening line / scene setting
{exam_instruct.md} — instructions for QXG on how to examine
{decision_instruct.md} — instructions for QXG to make final call
{scorer_instruct.md}   — scoring rubric and output format
```

---

### Phase C1: Setup (no LLM calls)

```python
# Compose effective identities
A1_eff = render("{gl.md}", hidden_obj=random_select(gl_hidden_objectives))
A2_eff = render("{sy.md}", hidden_obj=random_select(sy_hidden_objectives))

# Initialize empty transcripts
C2_transcript = []
C3_transcript = []
C4_transcript = []
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

**DM/Narrator interjections** (optional): If the narrator needs to interject (e.g., "秦孝公面色凝重" or scene changes), these are injected as additional user messages before the current speaker's turn:

```
session_SY.messages += [{ user: "[旁白] 甘龙此言一出，殿中众臣窃窃私语。" }]
session_SY.messages += [{ user: GL_turn_5 }]
```

**C2 output:**
```
C2_rendered = format_transcript(C2_transcript)
// "[第1轮] 商鞅：...\n[第2轮] 甘龙：...\n..."
```

---

### Phase C3: QXG Examines SY (hybrid, M rounds)

QXG receives the debate as a **document** in its system prompt, then has a **conversation** with SY.

```
qxg_system_for_SY = render("{qxg.md}", {
  debate_transcript: C2_rendered,
  exam_instructions: "{exam_instruct.md}",
  target: "商鞅"
})

session_QXG_SY = { system: qxg_system_for_SY, messages: [] }
```

**Round 1 — QXG asks:**
```
LLM_CALL_N+1 = LLM(
  system:   qxg_system_for_SY,
  messages: [{ user: "你现在要质询商鞅。请提出你的第一个问题。" }]
) → QXG_q1

session_QXG_SY.messages += [
  { user: "你现在要质询商鞅。请提出你的第一个问题。" },
  { assistant: QXG_q1 }
]
```

**Round 1 — SY answers:**

SY's session continues from the debate, but QXG's question is injected:
```
LLM_CALL_N+2 = LLM(
  system:   A2_eff,
  messages: [
    ...session_SY.messages,         // full debate history
    { user: "[秦孝公质询] " + QXG_q1 }
  ]
) → SY_a1

session_SY.messages += [
  { user: "[秦孝公质询] " + QXG_q1 },
  { assistant: SY_a1 }
]
C3_transcript += [{ q: QXG_q1, a: SY_a1 }]
```

**Round 2 — QXG follows up:**
```
session_QXG_SY.messages += [{ user: "商鞅答曰：" + SY_a1 }]

LLM_CALL_N+3 = LLM(
  system:   qxg_system_for_SY,
  messages: session_QXG_SY.messages + [{ user: "商鞅答曰：" + SY_a1 }]
) → QXG_q2

session_QXG_SY.messages += [{ assistant: QXG_q2 }]
```

**...pattern continues for M rounds.**

**Key insight**: SY's message array grows continuously from the debate into the QA — SY experiences the whole thing as one continuous conversation. QXG's session is separate and starts fresh for this examination.

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

One-shot. QXG receives ALL prior context as documents and makes a decision.

```
decision_system = render("{qxg.md}", {
  debate_transcript: C2_rendered,
  examination_SY: C3_rendered,
  examination_GL: C4_rendered,
  dm_instruction: "{decision_instruct.md}"
})

LLM_CALL_FINAL = LLM(
  system:   decision_system,
  messages: [{ user: "听完辩论与质询，你现在必须做出最终裁决。" }]
) → QXG_decision
```

**C5 output:**
```
C5_raw = QXG_decision   // free-form in-character speech
```

**Cross-discovery**: QXG discovers SY's secrets from GL's examination (C4), and GL's secrets from SY's examination (C3). This happens naturally — during C3, QXG asks SY probing questions that might reveal GL's weaknesses (since SY has incentive to expose GL), and vice versa in C4.

---

### Phase C6: Score Extraction (function style, 1 call)

Separate scorer LLM parses the decision into structured output. This is NOT an in-world character — it's a utility function.

```
LLM_CALL_SCORER = LLM(
  system:   "{scorer_instruct.md}" + ground_truth_assignments,
  messages: [{ user: C5_raw }]
) → { scoreA, scoreB, winner, reasoning }
```

Or, if the decision output format is structured enough, this can be **deterministic parsing** with no LLM call.

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

| Agent | Heaviest Call | System Prompt Contains | Messages Contain |
|-------|--------------|----------------------|-----------------|
| SY    | Last QA answer (C3) | soul + hidden obj (~800 tok) | 20 debate turns + 4 QA rounds (~8k tok) |
| GL    | Last QA answer (C4) | soul + hidden obj (~800 tok) | 20 debate turns + 4 QA rounds (~8k tok) |
| QXG   | Final decision (C5) | soul + debate transcript + 2x QA transcripts (~12k tok) | 1 instruction message |
| Scorer | C6 | rubric + ground truth (~1k tok) | QXG's decision (~2k tok) |

**Total context per game: ~40-60k tokens across all calls.**

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

### 9.1 Soul File (static identity)

```markdown
# {agent_name}.md

你是{角色名}。

## 身份
{角色背景、性格、动机}

## 目标
{公开目标}

## 行为约束
{时代限制、禁止行为}
```

### 9.2 Effective Identity (soul + runtime injection)

```typescript
type EffectiveIdentity = {
  system: string       // rendered soul + hidden objectives
  messages: Message[]  // grows during conversation phases
}
```

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

## 11. Open Questions

1. **Should C3 and C4 run in parallel or sequential?**
   - Parallel: faster, but QXG can't use insights from one examination in the other
   - Sequential: QXG can build on what it learned from SY when questioning GL

2. **Does QXG generate its own questions or are they templated?**
   - Generated: more natural, QXG adapts based on debate content
   - Templated: more reproducible, easier to control examination scope
   - Hybrid: first question templated, follow-ups generated

3. **Does the DM/Narrator need LLM calls?**
   - If DM just sets scenes: no LLM, use templates
   - If DM reacts to debate content: needs LLM calls, adds complexity

4. **How much of the debate does SY/GL see during QA?**
   - Full debate in message history (conversation continuation): natural but large
   - Summarized debate: saves tokens but may lose detail
   - Only their own turns + QA: minimal but loses opponent context

5. **Should QXG's examination sessions carry over to C5?**
   - Option A: C5 gets rendered transcripts of C3+C4 (function style, current proposal)
   - Option B: C5 continues QXG's conversation session from C3/C4 (carries forward messages)
