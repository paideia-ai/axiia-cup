import { describe, expect, it } from 'vitest'

import { roleDescriptionLines, scenarioModule } from './index'
import { honnojiDecisionIntro } from './intro-copy'

const honnoji = scenarioModule('honnoji-decision')

describe('Honnoji faction copy', () => {
  it('takes faction names from the reviewed intro copy', () => {
    const sides = honnojiDecisionIntro.source.participants.sides
    expect(honnoji?.factionCopy?.names).toEqual({
      a: sides.a.name,
      b: sides.b.name,
    })
    expect(honnoji?.factionCopy?.stances).toEqual({
      a: '主张袭击本能寺',
      b: '主张西进毛利',
    })
  })
  it('puts each role description from the server label on its own line', () => {
    expect(roleDescriptionLines(
      honnoji,
      'a',
      '长宗我部元亲的密使：为保全四国，说服光秀趁今夜突袭本能寺。足利义昭的使者：以重振幕府为名，说服光秀起兵讨伐信长。',
    )).toBe(
      '长宗我部元亲的密使：为保全四国，说服光秀趁今夜突袭本能寺。\n足利义昭的使者：以重振幕府为名，说服光秀起兵讨伐信长。',
    )
    expect(roleDescriptionLines(
      honnoji,
      'b',
      '细川藤孝：以故交身份，向光秀讲明起兵的风险，劝他继续西进。明智军中的足轻：从士卒的处境出发，劝光秀放弃夜袭，依令西进。',
    )).toBe(
      '细川藤孝：以故交身份，向光秀讲明起兵的风险，劝他继续西进。\n明智军中的足轻：从士卒的处境出发，劝光秀放弃夜袭，依令西进。',
    )
  })
  it('leaves scenarios without selectable roles unchanged', () => {
    const label = '自魏入秦的说客，无根无党，惟以变法自荐'
    expect(roleDescriptionLines(scenarioModule('shangyang-court'), 'a', label))
      .toBe(label)
    expect(scenarioModule('shangyang-court')?.factionCopy).toBeUndefined()
  })
})
