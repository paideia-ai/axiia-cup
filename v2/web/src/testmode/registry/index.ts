/* 各页面组的登记合并成一份。加新页面组：新建 registry/<组>.ts 导出 `TM_<组>` 与可选的 `STEPS_<组>`，在这里合并。
   合并顺序无意义，id 必须全局唯一（registry.test.ts 会查）。STEP_HINTS 若同一步骤由两组登记，后面的覆盖前面的——
   冲突的步骤在下面显式裁决，不靠顺序。 */
import type { StepHints, TmRegistry } from '../types'
import { STEPS_AGENTS, TM_AGENTS } from './agents'
import { STEPS_DISCOVERY, TM_DISCOVERY } from './discovery'
import { STEPS_E, TM_E } from './e'
import { STEPS_ENTRY, TM_ENTRY } from './entry'
import { STEPS_FA, TM_FA } from './fa'
import { STEPS_PERIPHERY, TM_PERIPHERY } from './periphery'

export const TM: TmRegistry = {
  ...TM_ENTRY,
  ...TM_AGENTS,
  ...TM_E,
  ...TM_DISCOVERY,
  ...TM_FA,
  ...TM_PERIPHERY,
}

export const STEP_HINTS: StepHints = {
  ...STEPS_ENTRY,
  ...STEPS_PERIPHERY,
  ...STEPS_DISCOVERY,
  ...STEPS_FA,
  ...STEPS_E,
  ...STEPS_AGENTS,
  // 两组都登记了的步骤，显式裁决：
  // j10s1「铃铛上有未读提醒」——观察点在铃铛（NAV），路由放通知页让铃铛与列表同屏
  j10s1: { route: '/notifications', marker: 'NAV.bell' },
  // j5s1「在智能体页点出战」——面板打开前只能聚光 EA 页的出战按钮（OS.tabs 此时还不在 DOM）
  j5s1: { route: '/agents/:id', marker: 'EA.field-button' },
  // j6s4「在战报里复制对手版本号」——动作起点在战报；后半段「按 id 约战」在 OS 面板，见 OS.byid-input
  j6s4: { route: '/matches/:id', marker: 'FA.copy-id-button' },
}

export type TmId = keyof typeof TM & string
