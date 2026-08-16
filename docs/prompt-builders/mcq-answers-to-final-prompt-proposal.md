# MCQ Answers → Final Prompt Proposal

## Goal

Generate a short final strategy prompt directly from the player's MCQ answers.

This workflow does not call an LLM and does not use a Prompt Builder. The selected
answers are rendered with LiquidJS and passed directly to the debate Agent as its
strategy prompt.

## Input

Each answer contains two strings:

```json
{
  "question": "你的身份",
  "answer": "真心为秦国变强的改革者"
}
```

All answers for one player are provided as an ordered array:

```json
{
  "answers": [
    {
      "question": "你的身份",
      "answer": "真心为秦国变强的改革者"
    },
    {
      "question": "你的核心策略",
      "answer": "强调旧制度无法强秦"
    },
    {
      "question": "你的反驳策略",
      "answer": "追问旧制度有何成效"
    },
    {
      "question": "你的请求管理策略",
      "answer": "优先隐藏真请求"
    }
  ]
}
```

The `question` value is the MCQ heading without its number. The `answer` value is
the selected option text without its `A.`, `B.`, `C.`, or `D.` prefix.

If the player chooses `D.（自行填写）`, the player's own text becomes the
`answer` value.

## LiquidJS Template

One template can render every role and scenario:

```liquid
{% for item in answers %}
{{ item.question }}：{{ item.answer }}。
{% endfor %}
```

## Example Output

```text
你的身份：真心为秦国变强的改革者。
你的核心策略：强调旧制度无法强秦。
你的反驳策略：追问旧制度有何成效。
你的请求管理策略：优先隐藏真请求。
```

This rendered text is the final strategy prompt. It should not be expanded,
rewritten, or summarized by another model.

## Rendering Rules

1. Preserve the question order from the MCQ file.
2. Render only completed answers.
3. Trim whitespace around `question` and `answer`.
4. Do not include option letters.
5. Do not include `D.（自行填写）`; include the player's actual text.
6. Treat question and answer values as plain text, not as LiquidJS source.
7. Do not add scenario facts, randomized cases, true-request information, or
   other runtime state.
8. Reject an empty submission.
9. Validate the rendered result against the strategy prompt's 1000-character
   limit.

## Suggested Data Shape

```ts
type McqPromptAnswer = {
  question: string;
  answer: string;
};

type McqPromptInput = {
  answers: McqPromptAnswer[];
};
```

The same shape supports:

- four-answer historical role MCQs;
- six-answer Trolley role MCQs;
- future MCQ sets with a different number of questions.

## Preview and Confirmation

Before submission, show the exact rendered prompt to the player. The player can
return to the MCQs and change an answer before confirming.

The preview must match the text sent to the debate Agent.

## Validation

Test at least:

1. one four-question historical role;
2. one six-question Trolley role;
3. all predefined option choices;
4. a custom `D` answer;
5. Chinese and English custom text;
6. punctuation and extra whitespace;
7. an unanswered question;
8. an entirely empty submission;
9. a result near or above 1000 characters;
10. text containing LiquidJS-looking characters such as `{{ example }}`.

## Acceptance Criteria

- The output contains only the MCQ question headings and chosen answers.
- The output order matches the MCQ order.
- A custom answer appears exactly as entered after trimming.
- No LLM call is made.
- No Prompt Builder is called.
- No randomized runtime information is requested or inserted.
- The preview and submitted strategy prompt are identical.
- The same LiquidJS template works for every current MCQ file.
