# v3-mock — Axiia Cup v3.3 规格的纯前端 mock

按 `axiia-cup-uiux/UI-Doc-v3.3.md`（2026-08-04 CONFIRMED 版）实现的**完整前端 mock**：
无后端，所有数据与「对局执行」由内置假引擎模拟（localStorage 持久化）。
参考 `v2/web` 的技术栈与视觉语言，但**不共享任何代码**。

## 运行

```sh
cd v3-mock
npm install
npm run dev        # http://localhost:5273
npm run typecheck
npm run build
```

## 演示路径

- **老玩家闭环**：`/login` → 「使用演示账号登录」→ 场景 D → DA 四层 → 构建器 E → 保存 →
  EA「选择对手」→ OS 面板派发 → 进行中的对战条 → 战报 FA（实况/回放/debug mode）。
- **新手快速通道**（A3）：`/register` 注册（任意邀请码）→ 自动落入 `/express` 简化版 DA →
  express 构建（只填一方，MCQ 预填）→ 保存并开战 → 直接进实况 → 首战完成后解锁三模式。
- 演示控制在 `/settings`（重置数据、模拟赛事阻挡试炼 #47）。

## 文档

| 文件 | 内容 |
|------|------|
| `docs/DECISIONS.md` | 实现中做出的全部决定与假设（含页面↔规格映射表） |
| `docs/BACKEND_REQUIREMENTS.md` | 前端明确需要后端提供的能力清单 |
| `docs/SPEC_ISSUES.md` | 实现过程中发现的规格问题（P1 方向性 / P2 不一致 / P3 注意项） |

## 结构

```
src/mock/      类型、§C2 配置注册表 mock、场景种子数据、假对局引擎、全局 store
src/pages/     A/B/C/D/DA/E/express/FA/EA/G/I/K/L 各页面
src/components ui 套件、app-shell（全局头部+铃铛）、OS 面板、进行中的对战条
```
