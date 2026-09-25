import type { AgentVersionDTO } from '../api/types'

const strategies = [
  ['先立小信', '先从一个县试行，约定验收期限，用可核实的结果回应疑虑。'],
  ['回应守旧', '承认旧制曾经有效，再指出人口、军费和土地变化如何改变了条件。'],
  ['明确赏罚', '把奖励和处罚写清楚，同样适用于贵族与庶民，避免执法随人而变。'],
  ['约束执行', '允许百姓申诉，追究官吏滥用权力的责任，让变法也受规则约束。'],
]

export function navigationVersions(
  count: number,
  agentID = 101,
): AgentVersionDTO[] {
  return Array.from({ length: count }, (_, index) => {
    const [note, strategy] = strategies[index % strategies.length]
    return {
      id: agentID * 100 + index + 1,
      agentID,
      ordinal: index + 1,
      snapshotSeq: index * 4,
      modelID: 'fixture-model',
      note,
      prompt:
        `你是商鞅。这一版的重点是${note}。\n\n${strategy}\n\n先听清对手提出的具体问题，再作答。区分眼前代价与长期收益，用一个具体例子解释制度变化。不要用口号代替证据；承认方案的边界，并说明如何检验。`,
      isEntry: index === Math.max(0, count - 3),
      matchCount: index % 5,
      winCount: Math.max(0, index % 5 - 1),
      lossCount: index % 5 > 0 ? 1 : 0,
      drawCount: 0,
    }
  })
}
