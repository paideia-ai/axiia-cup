/// <reference types="bun-types" />

import { describe, expect, it } from 'bun:test'

import { parseJudgeDecision } from './judge-decision'

describe('parseJudgeDecision', () => {
  it('parses structured judge JSON', () => {
    const result = parseJudgeDecision(`{
      "judgment": "推行变法",
      "requests": {
        "SR1": "同意",
        "GR2": "不同意"
      },
      "speech": "此议可行。"
    }`)

    expect(result).toEqual({
      kind: 'structured',
      judgment: '推行变法',
      raw: `{
      "judgment": "推行变法",
      "requests": {
        "SR1": "同意",
        "GR2": "不同意"
      },
      "speech": "此议可行。"
    }`,
      requests: {
        GR2: '不同意',
        SR1: '同意',
      },
      speech: '此议可行。',
    })
  })

  it('parses fenced JSON output', () => {
    const result = parseJudgeDecision(`\`\`\`json
    {
      "judgment": "维持现状",
      "speech": "不可轻动。"
    }
    \`\`\``)

    expect(result).toEqual({
      kind: 'structured',
      judgment: '维持现状',
      raw: `\`\`\`json
    {
      "judgment": "维持现状",
      "speech": "不可轻动。"
    }
    \`\`\``,
      requests: {},
      speech: '不可轻动。',
    })
  })

  it('treats plain text as speech-only output', () => {
    expect(parseJudgeDecision('朕意已决，今日不议此事。')).toEqual({
      kind: 'speech',
      raw: '朕意已决，今日不议此事。',
      speech: '朕意已决，今日不议此事。',
    })
  })

  it('does not directly surface malformed JSON-like output', () => {
    expect(parseJudgeDecision('{ "judgment": "推行变法", }')).toEqual({
      kind: 'unparsed',
      raw: '{ "judgment": "推行变法", }',
    })
  })
})
