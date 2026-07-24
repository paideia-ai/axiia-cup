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

The current Prompt Builders include three LiquidJS variables:

```liquid
{{ agent_prompt_template }}
{{ judge_prompt }}
{{ other_rules }}
```

These variables provide the model with authoritative reference material before
it begins the strategy-building conversation:

- `agent_prompt_template` contains the debate Agent's role, scenario context,
  request structure, runtime-information structure, and competition limits.
- `judge_prompt` contains the exact judge role, concerns, evaluation criteria,
  and decision logic that the strategy should address.
- `other_rules` contains short supplementary rules, such as scoring,
  competition flow, and the strategy prompt's length limit.

The Prompt Builder may use this material to understand the eventual debate
environment, but it must not ask the player to supply information that is only
selected at match runtime. Examples include the current true request, current
opponent, selected Trolley cases, and current Trolley case.

The Markdown files do not render these variables by themselves. A product
integration or rendering script must use LiquidJS to substitute the reference
material before presenting the Prompt Builder to a model.

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
