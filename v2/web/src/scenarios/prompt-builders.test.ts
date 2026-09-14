import { describe, expect, it } from 'vitest'
import { generatePromptBuilders } from '../../scripts/prompt-builders'
import builders from './prompt-builders.json'
import { metaPromptFor } from '../lib/meta-prompt'
import { shangyangCourt } from './shangyang-court'

describe('bundled Prompt Builder sources', () => {
  it('matches the product templates and current runtime reference material', () => {
    expect(
      builders,
      'Run deno task prompt-builders after editing product templates or scenario scripts',
    )
      .toEqual(generatePromptBuilders())
  })

  it('copies the selected product template with substitutions and no extra wrapper', () => {
    const template = builders.roles['shangyang-court'].a.template
    const output = metaPromptFor(shangyangCourt, '商鞅庭辩', 'a', '商鞅', null)
    // All non-variable text must survive exactly, including start and end.
    const escaped = template.split(/\{\{\s*\w+\s*\}\}/g).map((part) =>
      part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    )
    expect(output).toMatch(new RegExp(`^${escaped.join('[\\s\\S]*?')}$`))
  })
})
