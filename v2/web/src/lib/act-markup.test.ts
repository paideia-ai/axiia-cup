import { describe, expect, it } from 'vitest'

import { actTagNames, stripActTags, stripStreamingActTags } from './act-markup'

// 素材取自线上 /matches/56（fengyiting-real）与 /matches/49（sanguo）的真实行。
const osRow =
  '<os>他二人一开口，便不是父子。</os>\n<attention>董卓若此刻翻脸</attention>\n<favor>吕布</favor>\n<strength>略偏</strength>'
const osNames = ['attention', 'favor', 'os', 'strength']

describe('act 标签剥离（#22 心声卡已渲染同一份内容）', () => {
  it('剥掉 verdict 声明过的每个标签', () => {
    expect(stripActTags(osRow, osNames)).toBe('')
  })

  it('保留标签之前的叙述', () => {
    expect(
      stripActTags(
        '我选 A：先与董卓私谈，再与吕布私谈。\n<reason>先探口风</reason>\n<first-side>董卓</first-side>',
        ['first-side', 'reason'],
      ),
    ).toBe('我选 A：先与董卓私谈，再与吕布私谈。')
  })

  it('保留标签之前的舞台提示', () => {
    expect(
      stripActTags('（垂目静立，袖中指尖轻轻交叠）\n<os>此局不由我</os>', [
        'os',
      ]),
    ).toBe('（垂目静立，袖中指尖轻轻交叠）')
  })

  it('不碰 verdict 没有声明过的标签', () => {
    expect(stripActTags('<b>粗体</b>', ['os'])).toBe('<b>粗体</b>')
  })

  it('截断没有收尾的开标签', () => {
    expect(stripActTags('说完了。<os>他二人', ['os'])).toBe('说完了。')
  })

  it('跳过不是 ASCII 标识符的字段名', () => {
    expect(stripActTags('<心声>不该匹配</心声>', ['心声', '.*'])).toBe(
      '<心声>不该匹配</心声>',
    )
  })

  it('不动正文里的尖括号', () => {
    expect(stripActTags('3<5 时收兵', osNames)).toBe('3<5 时收兵')
  })

  it('标签名取自 verdict output 的键，非对象 output 给空表', () => {
    expect(actTagNames(JSON.stringify({ os: 'x', favor: '吕布' })))
      .toEqual(['os', 'favor'])
    expect(actTagNames('不是 JSON')).toEqual([])
    expect(actTagNames('[1,2]')).toEqual([])
  })
})

describe('流式 act 气泡的按形状剥离', () => {
  it('剥成对标签并截掉写到一半的开标签', () => {
    expect(stripStreamingActTags('（拱手）<os>他二人</os>\n<atten')).toBe(
      '（拱手）',
    )
    expect(stripStreamingActTags('说完了。<')).toBe('说完了。')
  })

  it('不动正文里的尖括号', () => {
    expect(stripStreamingActTags('3<5 时收兵')).toBe('3<5 时收兵')
  })
})
