# Prompt Builders

This directory contains prompt-engineering assets for debate preparation.

These documents are designed for both human contributors and AI systems. Rather than serving as debate prompts themselves, they support the construction of prompts that are ultimately used by debate agents.

As the project expands, additional Prompt Builders, Meta Prompt Builders, MCQs, and supporting documentation may be added for new debate scenarios.

---

# Asset Types

## Prompt Builders

**Audience:** End users.

Prompt Builders are prompts that users copy into their preferred large language model (e.g. ChatGPT, Claude, Gemini).

The model temporarily adopts the reasoning style and conversational habits of a particular debate character and collaborates with the user to develop a strong debate strategy.

Rather than immediately generating a strategy, the Prompt Builder asks questions, pressure-tests assumptions, explores alternative approaches, and helps the user gradually construct a final strategy prompt suitable for a debate agent.

Prompt Builders are therefore **interactive strategy-construction tools**, not debate agents.

### LiquidJS reference variables

The non-jury Prompt Builders use these reference variables:

```liquid
{{ agent_prompt_template }}
{{ judge_prompt }}
{{ other_rules }}
{{ strategy_prompt_limit }}
```

These variables provide the model with authoritative reference material before
it begins the strategy-building conversation:

- `agent_prompt_template` contains the debate Agent's role, scenario context,
  request structure, runtime-information structure, and competition limits.
- `judge_prompt` contains the exact judge role, concerns, evaluation criteria,
  and decision logic that the strategy should address.
- `other_rules` contains short supplementary rules, such as scoring,
  competition flow, and the strategy prompt's length limit.
- `strategy_prompt_limit` contains the configured final-strategy limit and
  counting convention (Chinese characters and English words, not all characters).

The Harbor jury builders instead use `agent_prompt_template`,
`public_case_packet`, `player_visible_rules`,
`npc_juror_system_prompt_template`, `npc_juror_personas`,
`npc_final_verdict_prompt`, and `strategy_prompt_limit`.

The Prompt Builder may use this material to understand the eventual debate
environment, but it must not ask the player to supply information that is only
selected at match runtime. Examples include the current true request, current
opponent, selected Trolley cases, and current Trolley case.

The Markdown files do not render these variables by themselves. The builder UI's
“让你的AI帮你想策略” helper selects the end-user document section for the current
scenario and role, then substitutes its reference variables before copying.
These documents only need simple variable substitution; the integration does
not evaluate Liquid tags, filters, or loops.

The frontend bundles `v2/web/src/scenarios/prompt-builders.json`, generated from
these documents and the scenario scripts. It includes player role templates and
judge/NPC reference material, including Harbor's E1–E5 packet and nine personas.
It excludes judge inner-monologue instructions and actual match state. Honnoji
includes both possible opponents for the selected role without choosing either
opponent or assigning a true request in advance. Templates show default match
parameters; the copied builder tells the AI to follow actual runtime information
when a match begins. Public scoring and the strategy length limit come from the
loaded API data.

After editing a source document or scenario script, run:

```sh
cd v2/web
deno task prompt-builders
deno task test:unit src/scenarios/prompt-builders.test.ts src/lib/meta-prompt.test.ts
```

Commit the generated JSON with its sources. CI checks parity and runs the web
lane for changes to these builder documents or scenario scripts. The generated
file lets the frontend Docker build use its existing `v2/web`-only context.

---

## Meta Prompt Builders

**Audience:** Project maintainers.

Meta Prompt Builders are internal development tools.

They are used to create new Prompt Builders with stronger character fidelity, better strategic guidance, and more effective interactive behavior.

Unlike Prompt Builders, Meta Prompt Builders are **not intended to be used directly by end users**.

Typical workflow:

```text
Meta Prompt Builder
        ↓
Creates
        ↓
Prompt Builder
        ↓
Used by end users
```

---

## MCQs (Multiple Choice Question Sets)

**Audience:** End users.

MCQs provide a structured alternative to Prompt Builders.

Instead of participating in an extended interactive conversation, users answer a sequence of carefully designed multiple-choice questions describing their strategic preferences and argumentative style.

These responses are then used to generate an appropriate debate strategy.

Compared with Prompt Builders:

- Prompt Builders emphasize exploration, discussion, and iterative refinement.
- MCQs emphasize speed, consistency, and lower interaction cost.

Both approaches ultimately produce strategy prompts for the same downstream debate agent.

### MCQ answers to final prompt proposal

[`mcq-answers-to-final-prompt-proposal.md`](./mcq-answers-to-final-prompt-proposal.md)
defines a proposed structured workflow that turns MCQ answers directly into the
final strategy prompt.

In this proposal, each selected answer is stored together with its question
heading. One shared LiquidJS template renders the ordered question-and-answer
pairs:

```liquid
{% for item in answers %}
{{ item.question }}：{{ item.answer }}。
{% endfor %}
```

This route does not call an LLM or a Prompt Builder. The rendered MCQ text is
the final strategy prompt, so the preview shown to the player must exactly match
the text submitted to the debate Agent.

The proposal is a design document. It does not mean that a LiquidJS renderer or
the MCQ product interface has already been implemented in this repository.

---

# Prompt Generation Pipeline

Two user-facing workflows are currently supported.

### Interactive Workflow

```text
User
    ↓
Prompt Builder
    ↓
Preferred LLM
    ↓
Interactive Discussion
    ↓
Strategy Prompt
    ↓
Debate Agent
```

### Structured Workflow

```text
User
    ↓
MCQs
    ↓
Strategy Prompt
    ↓
Debate Agent
```

Project development follows a separate internal workflow:

```text
Maintainer
    ↓
Meta Prompt Builder
    ↓
Prompt Builder
    ↓
End users
```
