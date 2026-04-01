# Axiia Cup 技术架构（MVP）

## 技术栈

```
┌─────────────────────────────────────────────────────────────┐
│ Monorepo (Turborepo + Bun workspaces)                        │
├──────────────┬──────────────────┬───────────────────────────┤
│ apps/web     │ apps/api         │ apps/cli                  │
│ React Router │ Hono + Bun       │ Commander.js              │
│ v7 SPA (Vite)│ SQLite (Drizzle) │ 调用 admin API            │
│ shadcn/ui    │ DB-backed worker │                           │
│ Tailwind v4  │ (同进程异步轮询)  │                           │
├──────────────┴──────────────────┴───────────────────────────┤
│ packages/shared — Zod schemas + TypeScript 类型              │
└─────────────────────────────────────────────────────────────┘
```

| 层       | 技术选择                                             | 决策理由                                                            |
| -------- | ---------------------------------------------------- | ------------------------------------------------------------------- |
| 语言     | 全栈 TypeScript                                      | 前后端共享类型                                                      |
| 前端     | React Router v7 SPA + Vite + shadcn/ui + Tailwind v4 | 纯 SPA 无 SSR 复杂度；竞赛平台不需要 SEO                            |
| 后端     | Hono (Bun)                                           | 轻量、TypeScript 原生（无需 tsx/tsc）、内置 SQLite、OpenAI 兼容 API |
| ORM      | Drizzle                                              | 支持 SQLite 和 PostgreSQL，将来可无痛迁移                           |
| 数据库   | SQLite (WAL 模式)                                    | 15 人 MVP 够用；零配置；单文件部署                                  |
| 任务队列 | DB 队列 (matches.status 轮询)                        | 不需要 Redis/BullMQ；worker 在 API 同进程异步执行                   |
| 管理工具 | CLI (Commander.js) + 只读 admin web                  | CLI 做所有管理操作；web admin 仅显示状态                            |
| Monorepo | Turborepo + Bun workspaces                           | 前后端包隔离，类型共享有明确入口；无需额外安装 pnpm                 |
| 认证     | 邮箱 + 固定 OTP 注册 + 密码登录 + JWT                | 见下方认证章节                                                      |
| 部署     | Docker (nginx + app 单进程)                          | 中国云 VPS                                                          |

---

## 认证流程

```
注册:
  邮箱 → 输入固定 OTP (123456) → 设置密码 → 创建账户 → JWT
  display name 默认 "momo"，登录后可修改

登录:
  邮箱 + 密码 → JWT (HS256, 7 天有效期)

管理员:
  users 表 is_admin 字段手动设置
```

- MVP 使用固定 OTP (123456)，不发送真实邮件
- 将来接入真实邮件服务（Resend 或国内邮件 API）时只需替换 OTP 生成逻辑
- 密码使用 bcrypt 哈希存储

---

## 对战引擎流程

```
对话阶段（turn_count 轮，场景可配置 10-20，默认 20）
    │
    ▼
裁判提问阶段（judge_rounds 轮，场景可配置，默认 3）
    │
    ├── For round = 1 to judge_rounds:
    │     裁判(system: judge_prompt;
    │          input: 背景 + 双方角色卡 + 边界约束 + transcript) → 生成问题给 A
    │     Agent A(system: 用户 prompt;
    │          input: 背景 + 本方角色卡 + 对手公开信息 + 边界约束 + transcript + 裁判问题) → 回答
    │
    ├── For round = 1 to judge_rounds:
    │     裁判(system: judge_prompt;
    │          input: 背景 + 双方角色卡 + 边界约束 + transcript) → 生成问题给 B
    │     Agent B(system: 用户 prompt;
    │          input: 背景 + 本方角色卡 + 对手公开信息 + 边界约束 + transcript + 裁判问题) → 回答
    │
    └── 裁判(system: judge_prompt;
           input: 背景 + 双方角色卡 + 边界约束 + transcript + 所有问答) → JSON 评分
        输出: { score_a, score_b, winner, reasoning }
```

- judge_prompt 对选手公开可见（对称博弈）
- 每对选手打 2 场（正反角色各一场），每场独立计分
- LLM API 失败时从失败点重试（不重启整场）

---

## 数据模型

```
users
  id, email, password_hash, display_name("momo"), is_admin, created_at

scenarios
  id, title, subject, context,
  role_a_name, role_a_public_goal,
  role_b_name, role_b_public_goal,
  boundary_constraints,
  turn_count (默认 20),
  judge_prompt (公开),
  judge_rounds (默认 3),
  created_at

submissions
  id, user_id, scenario_id, prompt_a, prompt_b, model, version, created_at

tournaments
  id, scenario_id, status (open/running/finished), current_round, created_at

rounds
  id, tournament_id, round_number, status (pairing/running/done)

matches
  id, round_id, scenario_id, sub_a_id, sub_b_id,
  status (queued/running/judging/scored/error),
  current_turn, transcript (JSON),
  judge_transcript_a (JSON),
  judge_transcript_b (JSON),
  score_a, score_b, winner, reasoning,
  error, started_at, finished_at, created_at
```

---

## 管理员 CLI 命令

```bash
axiia players          # 查看参赛者
axiia start            # 锁定参赛名单，生成第 1 轮随机配对
axiia status           # 查看当前轮进度
axiia next-round       # 按胜场配对下一轮
axiia leaderboard      # 查看排行榜（胜场 + Buchholz）
```

---

## 部署架构

```
┌────────────┬────────────┐
│   nginx    │   app      │
│ (SPA 静态) │ (Hono API  │
│            │  + worker  │
│            │  单进程)    │
└────────────┴────────────┘
  SQLite 文件在 volume 上
  部署到中国云 VPS (阿里云 ECS / 腾讯云 CVM)
  手动部署: docker compose up
```

---

## 前端页面

| 路由                      | 页面       | 说明                                                      |
| ------------------------- | ---------- | --------------------------------------------------------- |
| /login                    | 登录       | 邮箱 + 密码                                               |
| /register                 | 注册       | 邮箱 → OTP → 密码                                         |
| /dashboard                | 控制台     | 默认首页。个人赛事数据概览 + 最近对局列表                 |
| /scenarios/:id            | 智能体工坊 | 编写策略 prompt + 选模型 + 版本历史；场景材料在侧栏供参考 |
| /playground/:submissionId | 试炼场     | 自己 A vs 自己 B，查看对战进度与结果                      |
| /leaderboard              | 排行榜     | 胜场 + Buchholz 排名                                      |
| /matches/:id              | 对战详情   | transcript + 裁判追问 + 评分理由                          |
| /settings                 | 设置       | 修改 display name + 密码                                  |
| /admin                    | 管理面板   | 只读：比赛状态、队列、进度                                |

> 场景列表页（/scenarios）仍可访问，但已从导航移除——工坊页已包含所有场景信息。

---

## 不在 MVP 范围内

| 功能                       | 延后理由                                                  |
| -------------------------- | --------------------------------------------------------- |
| 多 Block 瑞士轮 + 迭代窗口 | MVP 单次瑞士轮够用，多 block 是纯新增                     |
| Elo/Glicko-2 积分          | 胜率排名足够，Elo 在加多 block 时一起做                   |
| 真实邮件 OTP               | 国际邮件服务送达中国邮箱不可靠；国内服务需 ICP 备案       |
| CI/CD 自动部署             | 手动 docker compose 部署；GFW 导致 GitHub→中国 VPS 不稳定 |
| Prompt 版本锁定            | MVP 由管理员口头约定比赛期间不改 prompt                   |
| 试炼场后端                 | 前端可用，后端可 stub 或延后                              |
| 忘记密码                   | MVP 期间管理员手动重置                                    |

---

## 实现并行策略

```
Lane A: 脚手架 + DB schema → Auth → CLI        (顺序)
Lane B: 脚手架完成后 → Match Engine             (独立)
Lane C: 脚手架完成后 → Swiss Pairing            (独立)
Lane D: 脚手架完成后 → Frontend Pages           (独立)

脚手架先完成，然后 B/C/D 并行开发。
```
