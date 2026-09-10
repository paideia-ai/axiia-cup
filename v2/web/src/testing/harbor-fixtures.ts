import type { MatchDetail, TurnDTO } from '../api/types'
import type { ScriptEvent } from '../lib/event'
import { finishedMatch } from './v34-fixtures'

export function harborEvent(seq: number, event: ScriptEvent): TurnDTO {
  return {
    seq,
    channel: 'observer',
    kind: 'event',
    speaker: 'game',
    finalText: '',
    event,
  }
}

function ballots(changed: boolean) {
  return [
    'a',
    'b',
    ...Array.from(
      { length: 9 },
      (_, i) => `j${String(i + 1).padStart(2, '0')}`,
    ),
  ].map((juror, i) => ({
    juror,
    verdict: (changed && (i === 2 || i === 7) ? i >= 7 : i !== 1 && i < 7)
      ? 'GUILTY'
      : 'NOT_GUILTY',
    reason: i < 2
      ? '固定立场票。'
      : changed && i === 2
      ? '时间线尚不能排除其他可能。'
      : changed && i === 7
      ? '重新对照陈述后，我更倾向于认定有罪。'
      : '维持当前证据判断。',
    reasoning: '示例推理记录，仅用于界面测试。',
  }))
}

export const harborMatch: MatchDetail = {
  ...finishedMatch,
  summary: {
    ...finishedMatch.summary,
    scenarioID: 'legal-harbor-murder-jury',
    scenarioTitle: '港口谋杀案 · 陪审团',
    participants: {
      ...finishedMatch.summary.participants!,
      b: {
        presetKey: 'doubt-unseen-moment',
        modelID: 'fixture-model',
        isMine: false,
      },
    },
    winner: 'a',
  },
  currentTurn: 5,
  turns: [
    harborEvent(0, {
      type: 'observer_secret_poll',
      round: 1,
      mover: 'a',
      guiltyVotes: 6,
      notGuiltyVotes: 5,
      ballots: ballots(false),
    }),
    harborEvent(1, {
      type: 'jury_speech',
      actor: 'b',
      text: '请再核对时间线，区分事实与推测。',
    }),
    harborEvent(2, {
      type: 'observer_secret_poll',
      round: 2,
      mover: 'b',
      guiltyVotes: 6,
      notGuiltyVotes: 5,
      ballots: ballots(true),
    }),
    harborEvent(3, {
      type: 'final_vote_reveal',
      guiltyVotes: 6,
      notGuiltyVotes: 5,
      threshold: 6,
      endReason: 'five-rounds',
      votes: ballots(true),
    }),
    harborEvent(4, {
      type: 'score',
      winner: 'a',
      guiltyVotes: 6,
      notGuiltyVotes: 5,
    }),
  ],
  stages: [{
    id: 'jury',
    title: '陪审团审议',
    channels: [{ id: 'observer', label: '真人幕后' }],
  }],
  verdicts: [],
  scoreA: 1,
  scoreB: 0,
  reasoning: '有罪票达到 6 票。',
  speakerLabels: {
    a: '林',
    b: '苏',
    ...Object.fromEntries(
      Array.from(
        { length: 9 },
        (_, i) => [`j${String(i + 1).padStart(2, '0')}`, `陪审员 ${i + 1}`],
      ),
    ),
  },
}
