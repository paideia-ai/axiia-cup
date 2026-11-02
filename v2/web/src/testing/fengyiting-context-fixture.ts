// Script routing fixture only: all speech and decisions below are authored demo
// content. This exercises main() without a model, server, journal or real match.
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import type {
  JSONValue,
  MatchDetail,
  Side,
  TurnDTO,
  VerdictDTO,
} from '../api/types'

interface Session {
  system: string
  messages: string[]
  push: (text: string) => void
  hear: (speaker: string, text: string) => void
  say: (options: { channel: string }) => Promise<{ text: string }>
  act: (spec: unknown, options: { key: string; channel: string }) => Promise<{
    fields: Record<string, string>
  }>
}

const lines: Record<string, string[]> = {
  a: [
    '奉先，今日之事总要说清。我暂不追究，你也收住兵刃。',
    '你若怕我迁怒，便说一条能叫你放心的规矩。',
    '我许下的事，不因你一句不顺耳的话便收回。',
    '你要的去处与侍从，都可先议，不必此刻答我。',
    '灯下还有话说，你且坐下。',
  ],
  b: [
    '貂蝉，我只问你如今可还平安。若有难处，莫独自担着。',
    '我有画戟，却不能替你定去处。你且说你自己的心愿。',
    '此事我自会承担，不拿你一句许诺作凭。',
    '你若还有难处，容我听明白，再想办法。',
    '你且回去，我在外等你的消息。',
  ],
  diaochan: [
    '（垂眸）妾只愿今日无人再为此事流血。',
    '（轻叹）将军的话，妾听见了，只怕明日又有变故。',
    '（抬眼）妾所求的退路，可也由妾自己来定么？',
    '（敛袖）妾还有一事，想请将军说清。',
    '（颔首）妾记下了，今日便到此处罢。',
  ],
}

export async function fengyitingContextFixture(first: Side = 'b') {
  const source = readFileSync(
    new URL(
      '../../../scenarios/scenarios/fengyiting-real/script.js',
      import.meta.url,
    ),
    'utf8',
  )
  const sessions: Record<string, Session> = {}
  const turns: TurnDTO[] = []
  const verdicts: VerdictDTO[] = []
  const emit = (channel: string, event: JSONValue) => {
    turns.push({
      seq: turns.length,
      kind: 'event',
      channel,
      speaker: '$game',
      finalText: '',
      event,
    })
  }
  const game = {
    params: {},
    playerPrompt: () => '先听她的顾虑，再说明自己愿意承担的事。',
    phase: (title: string) => emit('*', { type: 'phase', title }),
    emit,
    agent: (name: string, options: { system: string }) => {
      const counts: Record<string, number> = {}
      const session: Session = {
        system: options.system,
        messages: [],
        push: (text) => {
          session.messages.push(text)
        },
        hear: (speaker, text) => {
          session.messages.push(`${speaker}：${text}`)
        },
        say: ({ channel }) => {
          const index = counts[channel] ?? 0
          counts[channel] = index + 1
          const text = channel === 'b-2' && index === 3
            ? name === 'b'
              ? '来人既在催，我便不再拦你。只是归路若有变，遣人告我。'
              : '（敛袖）侍从尚在等候，容妾再说一句。'
            : lines[name][index % lines[name].length]
          turns.push({
            seq: turns.length,
            kind: 'dialogue',
            channel,
            speaker: name,
            finalText: text,
          })
          return Promise.resolve({ text })
        },
        act: (_spec, { key, channel }) => {
          const fields: Record<string, string> = key === 'order'
            ? {
              reason: '先稳住吕布，免他一时冲动。',
              'first-side': first === 'a' ? '董卓' : '吕布',
            }
            : {
              speech:
                '妾仍愿为汉室尽此一分心力。眼下向吕布示好，才有继续周旋的余地。',
              scheme: '继续连环计',
              side: '吕布',
            }
          const text = Object.entries(fields).map(([key, value]) =>
            `<${key}>${value}</${key}>`
          ).join('\n')
          const seq = turns.length
          turns.push({
            seq,
            kind: 'dialogue',
            channel,
            speaker: name,
            finalText: text,
          })
          verdicts.push({
            key,
            output: JSON.stringify(fields),
            afterSeq: seq,
            model: 'scripted-preview',
          })
          return Promise.resolve({ fields })
        },
      }
      sessions[name] = session
      return session
    },
  }
  const { meta, main } = runInNewContext(`${source}\n;({ meta, main })`, {
    game,
  })
  const result = await main()
  const match: MatchDetail = {
    summary: {
      id: first === 'a' ? 501 : 502,
      scenarioID: meta.id,
      scenarioTitle: meta.title,
      kind: 'pve',
      dispatched: true,
      finished: true,
      scored: true,
      viewed: false,
      winner: result.winner,
      initiatorIsMe: true,
      participants: {
        a: {
          agentID: 400,
          agentName: '不争一时',
          versionID: 4000,
          isMine: true,
          ownerDisplayName: 'yihan',
          modelID: 'glm-5.3',
        },
        b: {
          presetKey: 'lyubu-real-military',
          presetLabel: '宫门伏兵',
          isMine: false,
          modelID: 'glm-5.3',
        },
      },
    },
    currentTurn: turns.length,
    turns,
    verdicts,
    stages: meta.stages,
    speakerLabels: meta.speakerLabels,
    ...result,
  }
  return { match, sessions, meta }
}
