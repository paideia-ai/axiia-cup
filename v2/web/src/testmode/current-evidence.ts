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
    scope: '当前公开场景已工程核验',
    summary:
      '当前5个公开场景的一句话介绍与学科分类已在桌面/手机分别核对；目录与详情的统计展示已对照真实已计分对局核验，最小样本边界由后端接口测试覆盖。',
    remaining: '本轮真人验收仍需完成，后续场景内容需另行核对。',
    releases: [
      {
        label: '前端 #182',
        revision: '28a5d69cef3707a2dc3e1ce0a6ffdb70dadd4b5c',
        url: 'https://github.com/paideia-ai/axiia-cup/pull/182',
      },
      {
        label: '后端边界测试 #60',
        revision: '6c7fa7848621aa5f7280fa7b340c075f11f65eec',
        url: 'https://github.com/paideia-ai/axiia-cup-v2/pull/60',
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
  if (reviewedClauses[id]?.versionId.startsWith('policy-2026-09-17:')) {
    return '2026-09-17'
  }
  return reviewedClauses[id]
    ? reviewed.capturedAt
    : spec.generatedAt.slice(0, 10)
}
