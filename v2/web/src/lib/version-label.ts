// E2/#82：版本号一律取 ordinal（服务端按 id 次序派生的线性序号）。snapshotSeq
// 是草稿暂存水位——既非线性也非单射（同一智能体可以有两个 0），不是版本号，
// 任何界面都不再读它。
//
// ordinal 在契约里是可选的：服务端的这一半单独发布，dev 上可能短暂还是旧的。
// 缺席时按同一定义在本地补——版本表 append-only、id 自增不复用，所以「id 不大于
// 它的同伴数」就是它的 1 基位次，与服务端算出来的是同一个量。

import type { AgentVersionDTO } from '../api/types'

export function versionOrdinal(
  version: AgentVersionDTO,
  siblings: readonly AgentVersionDTO[] = [],
): number {
  if (version.ordinal != null) return version.ordinal
  const rank = siblings.filter((other) => other.id <= version.id).length
  return rank > 0 ? rank : 1
}

export function versionTag(
  version: AgentVersionDTO,
  siblings: readonly AgentVersionDTO[] = [],
): string {
  return `v${versionOrdinal(version, siblings)}`
}

export function versionLabel(
  version: AgentVersionDTO,
  siblings: readonly AgentVersionDTO[] = [],
): string {
  return `${versionTag(version, siblings)}${
    version.isEntry ? ' ★' : ''
  } · ${version.modelID}`
}

// E3/#82：恢复到工作区后的固定文案——N 为当前已有版本数，下一次保存即 v(N+1)。
export function nextVersionCopy(versionCount: number): string {
  return `保存后将成为 v${versionCount + 1}`
}
