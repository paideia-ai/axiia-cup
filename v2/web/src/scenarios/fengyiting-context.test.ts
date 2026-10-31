import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { describe, expect, it } from 'vitest'
import { assembleDeck } from '../lib/deck'
import { eventString, scriptEvent } from '../lib/event'
import { transcriptTabPlan } from '../lib/transcript-tabs'
import { fengyitingContextFixture } from '../testing/fengyiting-context-fixture'
import { fengyitingRealDecks } from './decks/fengyiting-real'
import { fengyitingReal } from './fengyiting-real'

const source = readFileSync(
  new URL(
    '../../../scenarios/scenarios/fengyiting-real/script.js',
    import.meta.url,
  ),
  'utf8',
)

interface Preset {
  side: 'a' | 'b'
  prompt: string
}

const { meta, playerSystem } = runInNewContext(
  `${source}\n;({ meta, playerSystem })`,
) as {
  meta: { presets: Preset[] }
  playerSystem: (me: string, opponent: string, artifact: string) => string
}

describe('Fengyiting opening context', () => {
  for (const first of ['a', 'b'] as const) {
    it(`delivers the post-throw scene privately when ${first} meets first`, async () => {
      const { sessions, match } = await fengyitingContextFixture(first)
      const scenes = match.turns.flatMap((turn) => {
        const event = scriptEvent(turn)
        return event?.type === 'scene'
          ? [{ channel: turn.channel, text: event.text }]
          : []
      })
      const speeches = match.turns.filter((turn) =>
        turn.kind === 'dialogue' && turn.channel !== 'order' &&
        turn.channel !== 'verdict'
      )
      for (const name of ['a', 'b', 'diaochan']) {
        const system = sessions[name].system
        expect(system).toMatch(/董卓[^。]*向吕布掷出画戟/)
        expect(system).toContain('吕布挡落画戟，尚未离开后园')
        expect(system).toContain('貂蝉仍在旁')
      }
      for (const name of ['a', 'b']) {
        const context = [sessions[name].system, ...sessions[name].messages]
          .join('\n')
        expect(context).not.toMatch(/连环计|经典结局|北掖门/)
      }
      expect(sessions.diaochan.system).toContain('承诺协助连环计')
      expect(sessions.diaochan.system).toContain('尚未向董卓、吕布公开')
      expect(sessions.a.system).toContain('你已接受王允献来的貂蝉')
      expect(sessions.a.system).not.toContain('王允曾当面许貂蝉与你')
      expect(sessions.b.system).toContain('王允曾当面许貂蝉与你')
      for (const side of ['a', 'b'] as const) {
        expect(sessions[side].system).toBe(
          fengyitingReal.roleTemplates![side]!.replace(
            '〔玩家在外部 AI 中确认后生成的策略；比赛时由系统合并〕',
            '先听她的顾虑，再说明自己愿意承担的事。',
          ),
        )
      }
      expect(sessions.diaochan.messages.join('\n')).toContain(
        '先决定：继续连环计',
      )
      expect(scenes[0]).toEqual({
        channel: 'public',
        text:
          '【系统】凤仪亭前。现在董卓与吕布进行 3 个完整对峙轮次，每轮董卓先发言、吕布回应；貂蝉在场旁听。',
      })
      expect(scenes.filter((scene) => scene.channel === 'public')).toHaveLength(
        1,
      )
      expect(speeches.slice(0, 2)).toMatchObject([
        { speaker: 'a', channel: 'public' },
        { speaker: 'b', channel: 'public' },
      ])
      expect(speeches).toHaveLength(46)
      expect(match.verdicts.map((verdict) => verdict.key)).toEqual([
        'order',
        'final',
      ])
      expect(match).toMatchObject({ winner: 'b', scoreA: 0, scoreB: 1 })
    })
  }

  it('keeps private-plan and future knowledge out of every official player strategy', () => {
    const strategies = [...meta.presets]
    for (const side of ['a', 'b'] as const) {
      const deck = fengyitingRealDecks.decks[side]!
      for (const question of deck.questions) {
        for (const option of question.options) {
          strategies.push({
            side,
            prompt: assembleDeck(deck, { [question.id]: option.id }),
          })
        }
      }
    }
    for (const { side, prompt } of strategies) {
      const context = playerSystem(
        side === 'a' ? '董卓' : '吕布',
        side === 'a' ? '吕布' : '董卓',
        prompt,
      )
      expect(context).not.toMatch(/连环计|经典结局|北掖门|反攻长安/)
    }
  })
})

describe('Fengyiting delayed report', () => {
  it('delivers yesterday’s first talk only, while the corridor talk continues', async () => {
    const { match, sessions } = await fengyitingContextFixture('b')
    const firstTalk = match.turns.filter((turn) =>
      turn.channel === 'b-1' && turn.kind === 'dialogue'
    ).map((turn) =>
      `${turn.speaker === 'b' ? '吕布' : '貂蝉'}：${
        turn.finalText.replace(/（[^）]*）/g, '').trim()
      }`
    ).join('\n')
    const report = sessions.a.messages.find((text) =>
      text.includes('一名旧部辗转求见')
    )!
    expect(report).toContain('昨日你入朝期间')
    expect(report.split('如下：\n\n')[1].split('\n\n此刻')[0]).toBe(firstTalk)
    expect(sessions.a.messages.join('\n')).not.toContain(
      '来人既在催，我便不再拦你',
    )
    for (const name of ['b', 'diaochan']) {
      expect(sessions[name].messages.join('\n')).not.toContain(
        '一名旧部辗转求见',
      )
      expect(sessions[name].messages.join('\n')).toContain('催促等候')
      expect(sessions[name].messages.join('\n')).toContain('又过一日')
    }
    expect(sessions.a.messages.join('\n')).toContain('又过一日')
    const summons = match.turns.find((turn) => {
      const event = scriptEvent(turn)
      return event && eventString(event, 'text')?.includes('来人在旁等候')
    })!
    const reportEvent = match.turns.find((turn) => turn.channel === 'leak-a')!
    expect(scriptEvent(reportEvent)?.text).toContain('昨日偷听')
    expect(scriptEvent(reportEvent)?.text).toContain('并未听见正在回廊')
    expect(reportEvent.seq).toBeLessThan(summons.seq)
    expect(
      match.turns.some((turn) =>
        turn.seq < reportEvent.seq && turn.channel === 'b-2' &&
        turn.kind === 'dialogue'
      ),
    ).toBe(true)
    expect(
      match.turns.some((turn) =>
        turn.seq > summons.seq && turn.channel === 'b-2' &&
        turn.kind === 'dialogue'
      ),
    ).toBe(true)
    const lastCorridor = match.turns.filter((turn) => turn.channel === 'b-2')
      .at(-1)!
    expect(match.turns.find((turn) => turn.channel === 'a-2')!.seq)
      .toBeGreaterThan(lastCorridor.seq)

    const plan = transcriptTabPlan('fengyiting-real', match.turns)!
    for (const turn of match.turns) {
      const event = scriptEvent(turn)
      if (
        turn.channel === 'b-2' || turn.channel === 'leak-a' ||
        event?.title === '与此同时·内室旧部迟报' ||
        event?.title === '回到回廊·侍从催归'
      ) expect(plan.bySeq.get(turn.seq)).toBe(2)
    }
  })
})
