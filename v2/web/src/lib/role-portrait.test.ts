import { describe, expect, it } from 'vitest'
import { speakerLabels } from '../components/timeline/labels'
import type { EmotionCategory } from './emotion-playback'
import { rolePortrait } from './role-portrait'

describe('neutral portrait identity', () => {
  for (
    const [a, aFile] of [['chosokabe', 'chosokabe-envoy'], [
      'yoshiaki_envoy',
      'yoshiaki-envoy',
    ]]
  ) {
    for (
      const [b, bFile] of [['hosokawa_fujitaka', 'hosokawa-fujitaka'], [
        'akechi_ashigaru',
        'ashigaru',
      ]]
    ) {
      it(`resolves the actual cast ${a} / ${b}, including old IDs`, () => {
        const labels = speakerLabels('honnoji-decision', {}, [a, b])
        expect(rolePortrait(labels, 'a')).toContain(`${aFile}-neutral.webp`)
        expect(rolePortrait(labels, 'b')).toContain(`${bFile}-neutral.webp`)
        expect(rolePortrait(labels, a)).toBe(rolePortrait(labels, 'a'))
        expect(rolePortrait(labels, b)).toBe(rolePortrait(labels, 'b'))
      })
    }
  }

  it('does not guess a portrait from a faction or ambiguous cast', () => {
    const labels = speakerLabels('honnoji-decision', { a: '主张杀信长' })
    expect(rolePortrait(labels, 'a')).toBeNull()
    expect(
      rolePortrait(
        speakerLabels('honnoji-decision', {}, ['chosokabe', 'yoshiaki']),
        'a',
      ),
    ).toBeNull()
    expect(rolePortrait(speakerLabels('unknown', {}), 'a')).toBeNull()
    expect(rolePortrait(labels, 'unknown')).toBeNull()
  })

  it.each([
    ['shangyang-court', 'judge', 'qin-xiaogong'],
    ['trolley-problem', 'judge', 'minglizhe'],
    ['fengyiting-real', 'judge-aside', 'diaochan'],
    ['fengyiting-real', 'spy', 'spy'],
    ['legal-harbor-murder-jury', 'j07', 'fang-zhi'],
    ['legal-harbor-murder-jury', 'a', 'lin'],
  ])('maps %s / %s to its artwork', (scenario, speaker, file) => {
    expect(rolePortrait(speakerLabels(scenario, {}), speaker)).toContain(
      `${file}-neutral.webp`,
    )
  })
})

describe('ten-emotion portrait assets', () => {
  const categories: [EmotionCategory, string][] = [
    ['E01', 'neutral'],
    ['E02', 'resolute'],
    ['E03', 'wary'],
    ['E04', 'hesitant'],
    ['E05', 'anxious'],
    ['E06', 'angry'],
    ['E07', 'scornful'],
    ['E08', 'sad'],
    ['E09', 'caring'],
    ['E10', 'moved'],
  ]
  it.each(categories)(
    'selects %s without falling back to neutral',
    (category, slug) => {
      for (
        const [scenario, speaker, character] of [
          ['shangyang-court', 'a', 'shangyang'],
          ['honnoji-decision', 'judge', 'akechi-mitsuhide'],
          ['trolley-problem', 'b', 'wuren'],
          ['fengyiting-real', 'judge-aside', 'diaochan'],
          ['legal-harbor-murder-jury', 'j07', 'fang-zhi'],
        ]
      ) {
        expect(rolePortrait(speakerLabels(scenario, {}), speaker, category))
          .toContain(`${character}-${slug}.webp`)
      }
    },
  )
  it('includes all ten files for every neutral character', () => {
    const assets = Object.keys(import.meta.glob('../assets/portraits/*/*.webp'))
    const neutrals = assets.filter((path) => path.endsWith('-neutral.webp'))
    expect(neutrals).toHaveLength(29)
    expect(assets).toHaveLength(290)
    for (const neutral of neutrals) {
      for (const [, slug] of categories) {
        expect(assets).toContain(
          neutral.replace('-neutral.webp', `-${slug}.webp`),
        )
      }
    }
  })
})
