import { describe, expect, it } from 'vitest'
import { generatePromptBuilders } from '../../scripts/prompt-builders'
import builders from './prompt-builders.json'

describe('bundled Prompt Builder sources', () => {
  it('matches the authored role sections and current runtime reference material', () => {
    expect(
      builders,
      'Run deno task prompt-builders after editing the source documents or scripts',
    )
      .toEqual(generatePromptBuilders())
  })
})
