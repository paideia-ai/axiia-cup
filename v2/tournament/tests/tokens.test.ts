import { assertEquals } from '@std/assert'
import { countTokens } from '../src/tokens.ts'
import { mockPrompt } from '../src/backend/mock.ts'

// Expected counts from Python tiktoken 0.12.0:
// tiktoken.get_encoding("cl100k_base").encode_ordinary(s)
const FIXTURE: [string, number][] = [
  ['', 0],
  ['alpha alpha alpha', 3],
  ['你是商鞅，面对秦孝公。\n请陈述变法之要。', 24],
  ['<|endoftext|> is plain text here', 11],
  ['  trailing spaces and\ttabs\n\n', 7],
  ['emoji 🎲🎲 and 混合 text', 13],
]

Deno.test('cl100k_base encode_ordinary matches Python tiktoken', () => {
  for (const [text, n] of FIXTURE) assertEquals(countTokens(text), n, JSON.stringify(text))
})

Deno.test('mock prompts have exactly the requested count', () => {
  for (const n of [0, 1, 7, 1500]) assertEquals(countTokens(mockPrompt(n)), n)
})
