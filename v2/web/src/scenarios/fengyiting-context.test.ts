import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { describe, expect, it } from 'vitest'
import { assembleDeck } from '../lib/deck'
import { fengyitingRealDecks } from './decks/fengyiting-real'

const source = readFileSync(
  new URL(
    '../../../scenarios/scenarios/fengyiting-real/script.js',
    import.meta.url,
  ),
  'utf8',
)

interface Session {
  system: string
  messages: string[]
}

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

// Capture actual script delivery and emits. This tests context routing, not
// model behavior; replies deliberately contain no story information.
async function runScenario(first: '董卓' | '吕布') {
  const sessions: Record<string, Session> = {}
  const scenes: { channel: string; text: string }[] = []
  const speeches: { actor: string; channel: string }[] = []
  const decisions: string[] = []
  const game = {
    params: {},
    playerPrompt: () => '以坦诚和克制争取貂蝉。',
    phase: () => {},
    emit: (channel: string, event: { type: string; text?: string }) => {
      if (event.type === 'scene') scenes.push({ channel, text: event.text! })
    },
    agent: (name: string, options: { system: string }) => {
      const session: Session = { system: options.system, messages: [] }
      sessions[name] = session
      return {
        push: (text: string) => session.messages.push(text),
        hear: (speaker: string, text: string) =>
          session.messages.push(`${speaker}：${text}`),
        say: ({ channel }: { channel: string }) => {
          speeches.push({ actor: name, channel })
          return { text: `${name}-${channel}-${speeches.length}` }
        },
        act: (_spec: unknown, { key }: { key: string }) => {
          decisions.push(key)
          return {
            fields: key === 'order'
              ? { reason: '先安抚眼前之人。', 'first-side': first }
              : { speech: '心意已定。', scheme: '继续连环计', side: '吕布' },
          }
        },
      }
    },
  }
  const main = runInNewContext(`${source}\n;main`, { game }) as () => Promise<
    { winner: string; scoreA: number; scoreB: number }
  >
  const result = await main()
  return { sessions, scenes, speeches, decisions, result }
}

describe('Fengyiting opening context', () => {
  for (const first of ['董卓', '吕布'] as const) {
    it(`delivers the post-throw scene privately when ${first} meets first`, async () => {
      const { sessions, scenes, speeches, decisions, result } =
        await runScenario(first)
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
      expect(speeches.slice(0, 2)).toEqual([
        { actor: 'a', channel: 'public' },
        { actor: 'b', channel: 'public' },
      ])
      expect(speeches).toHaveLength(46)
      expect(decisions).toEqual(['order', 'final'])
      expect(result).toMatchObject({ winner: 'b', scoreA: 0, scoreB: 1 })
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
