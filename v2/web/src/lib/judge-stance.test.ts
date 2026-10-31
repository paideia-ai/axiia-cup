import { describe, expect, it } from 'vitest'
import { judgeFavorSide, speakerLabels } from '../components/timeline/labels'
import { parseOsBeat } from './verdict'
import { buildReplaySteps, replayBeats } from './replay'

const labels = speakerLabels('honnoji-decision', {
  a: '足利义昭的使者',
  b: '明智军中的足轻',
})

describe('judge stance, independent of preferred speaker', () => {
  it('can approve the ashigaru request while preferring to attack Honnoji', () => {
    const beat = parseOsBeat(JSON.stringify({
      os: '足轻要一道明白军令，这话不错。军令便是转向京中，袭击本能寺。',
      stance: '袭击本能寺',
    }))
    expect(beat.dimension).toBe('stance')
    expect(beat.favor).toBe('袭击本能寺')
    expect(judgeFavorSide(labels, beat.favor, beat.dimension)).toBe('a')
  })

  it('preserves old role preferences without inferring a policy decision', () => {
    for (const field of ['favor', 'tendency']) {
      const beat = parseOsBeat(JSON.stringify({ [field]: '明智军中的足轻' }))
      expect(beat.dimension).toBe('legacy')
      expect(beat.favor).toBe('明智军中的足轻')
      expect(judgeFavorSide(labels, beat.favor, beat.dimension)).toBe('b')
    }
  })

  it('does not interpret a role or unknown stance as a main decision', () => {
    expect(judgeFavorSide(labels, '明智军中的足轻', 'stance')).toBeNull()
    expect(judgeFavorSide(labels, '未定', 'stance')).toBeNull()
    expect(parseOsBeat('plain historical text').fallbackText).toBe(
      'plain historical text',
    )
  })

  it.each([
    ['honnoji-decision', '袭击本能寺', '西进毛利'],
    ['shangyang-court', '推行变法', '维持现状'],
    ['trolley-problem', '保护一人', '保护五人'],
  ])('maps the decision vocabulary for %s', (scenario, a, b) => {
    const scene = speakerLabels(scenario, {})
    expect(judgeFavorSide(scene, a, 'stance')).toBe('a')
    expect(judgeFavorSide(scene, b, 'stance')).toBe('b')
  })

  it('marks replay changes using the stance rather than a legacy role field', () => {
    const beats = replayBeats(
      buildReplaySteps(
        [],
        ['袭击本能寺', '西进毛利'].map((stance, index) => ({
          key: `os-${index + 1}`,
          afterSeq: index,
          model: 'judge',
          output: JSON.stringify({ stance, favor: '明智军中的足轻' }),
        })),
      ),
    )
    expect(beats.map((beat) => beat.beat.favor)).toEqual([
      '袭击本能寺',
      '西进毛利',
    ])
    expect(beats.map((beat) => beat.changed)).toEqual([false, true])
  })
})
