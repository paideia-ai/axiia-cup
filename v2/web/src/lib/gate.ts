// #65 按侧门槛的展示口径（mock V16）：OS 面板锁定条、D 卡徽章、DA 门槛卡
// 共用同一套算术——beaten 超阈值时按 needed 截断显示（1/1 而非 3/1）。

import type { GateProgressDTO, GateSideProgressDTO } from '../api/types'

export function sideMet(side: GateSideProgressDTO): boolean {
  return side.beaten >= side.needed
}

// A6：门槛是双侧的——两侧都过线才算解锁。
export function gateMet(progress: GateProgressDTO): boolean {
  return sideMet(progress.a) && sideMet(progress.b)
}

export function sideProgressText(side: GateSideProgressDTO): string {
  return `${Math.min(side.beaten, side.needed)}/${side.needed}`
}
