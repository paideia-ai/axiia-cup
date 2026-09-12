// Engineering evidence is independent of the captured spec audit and human
// results. A changed reviewed clause version invalidates an older record.
import spec from './data/spec-index.json'
import reviewed from './data/vivian-a3-a4-a6.json'

export interface ClauseEngineeringEvidence {
  versionPin: string
  checkedAt: string
  scope: string
  summary: string
  remaining: string
  releases: readonly { label: string; revision: string; url: string }[]
}

export const CURRENT_EVIDENCE: Readonly<
  Record<string, ClauseEngineeringEvidence>
> = {
  'U04-C01': {
    versionPin: 'comment-v2:U04-C01',
    checkedAt: '2026-09-12',
    scope: '部分覆盖',
    summary:
      '游客场景卡与详情访问、“数据积累中”文案已部署，并完成真实接口和浏览器检查。',
    remaining:
      '这些证据不覆盖本条全部要求；一句话介绍与 §C2 最小已完成对局数的统计边界，仍需本轮逐场景核验。',
    releases: [
      {
        label: '前端 #175',
        revision: 'caf86f74aee381579c72b04453fe34e679f805b3',
        url: 'https://github.com/paideia-ai/axiia-cup/pull/175',
      },
      {
        label: '后端 #55',
        revision: 'e30884710ebb649ebb2f8284c012064ad40b403b',
        url: 'https://github.com/paideia-ai/axiia-cup-v2/pull/55',
      },
    ],
  },
  'U06-C14': {
    versionPin: 'baseline:U06-C14',
    checkedAt: '2026-09-12',
    scope: '组织方报名校验已部署',
    summary:
      '组织方报名接口已部署双侧 ★ 校验；缺少任一侧时明确拒绝并点名缺失侧。自动接口测试覆盖拒绝与补齐后报名。',
    remaining:
      '本轮组织方账号与可报名赛事 fixture 仍待准备，需留下实际拒绝和接受的证据；已有保存版本却无 ★ 的真实旧数据分支也仍待准备。此项无需等待产品裁决。',
    releases: [
      {
        label: '后端 #57',
        revision: '3d0726d86b94311f0644f59b7c3967dae5bbc982',
        url: 'https://github.com/paideia-ai/axiia-cup-v2/pull/57',
      },
    ],
  },
}

const reviewedClauses = reviewed.confirmedClauses as Record<
  string,
  { versionId: string }
>

export function matchingCurrentEvidence(
  id: string,
  versionPin: string | undefined,
): ClauseEngineeringEvidence | undefined {
  const evidence = CURRENT_EVIDENCE[id]
  return evidence && evidence.versionPin === versionPin ? evidence : undefined
}

export function currentClauseEvidence(id: string) {
  return matchingCurrentEvidence(id, reviewedClauses[id]?.versionId)
}

export function clauseAuditDate(id: string): string {
  return reviewedClauses[id]
    ? reviewed.capturedAt
    : spec.generatedAt.slice(0, 10)
}
