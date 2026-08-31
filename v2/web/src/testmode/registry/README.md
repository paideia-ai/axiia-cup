# 测试模式登记表（registry/）

一个页面组一个文件，导出：

```ts
import type { StepHints, TmRegistry } from '../types'
export const TM_E: TmRegistry = {
  'E.save-button': {
    label: '保存按钮',
    clauses: ['U02-C09', 'U02-C10', 'U01-C04'],
    anchors: ['spec-change-88', 'spec-p12'],
    journeys: ['j3s5', 'j4s1'],
    note: '保存 = 存一个版本、不派发；保存后停留在 E 页',
  },
  'E.save-notice': {
    label: '保存成功提示',
    clauses: ['U02-C11', 'U02-C11b'],
    journeys: ['j4s2'],
    when: '保存一次后出现',
  },
}
export const STEPS_E: StepHints = {
  j3s5: { route: '/agents/:id/build', marker: 'E.save-button' },
}
```

规则：

- id = `<页面代号>.<slug>`（页面代号见
  ../types.ts）。同一个部件在不同页面复用（如 os-panel 在 DA 和 EA
  都出现）用它所属页面代号 `OS.`。 也就是说：VersionList 与 OS
  面板是共享部件，在 EA / DA 页上它们的标记仍以 `E.` / `OS.`
  开头——测试者报「E.version-card」可能是在智能体视图页看到的。
- 加载中 / 错误 / 空态类部件（id 以 `-loading` / `-error` / `-empty`
  结尾）一律挂 `LACK-10`（错误态 / 空态规格缺条），六个组一个口径。
- `clauses`
  只放**这个部件直接体现**的条款（按相关度排序）；章节级的泛条款不要塞进每个部件。找条款：`../data/spec-index.json`（按
  page 字段筛，读 q 规格原话 / s 审计观察）、`../data/e2e-signals.json`（e2e
  测试标题里的条款号 ↔ 它用的 testid / role 文案）、源码注释里的 `#N` / `E10` /
  `P11` / `U02-C11b`（都是规格引用）。
- `journeys` 放**在这个部件上发生**的旅程步骤（`../data/journeys.json` 的
  step.id）；顺便在 `STEPS_*` 里给那一步填 route +
  marker，导测就能自动导航并聚光。
- 没有条款可对的部件也要登记（`clauses`
  留空），测试模式会把它显示成「未映射」——那就是规格的缺口，Yihan
  要看的正是这个。
- 合并到 `index.ts` 的 `TM` / `STEP_HINTS`。校验：`deno task tm:check`（标记 ↔
  登记一一对应、条款 id 存在、步骤 id 存在）。
