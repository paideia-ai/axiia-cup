/** Mock Gallery — index page listing all available mock screens */
import { Link } from 'react-router-dom'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'

const screens = [
  {
    group: '公开页面',
    items: [
      { to: '/mocks/landing', label: 'Landing', desc: '首页（未登录视角）' },
      { to: '/mocks/login', label: 'Login', desc: '登录页' },
      { to: '/mocks/register', label: 'Register', desc: '注册页（第二步）' },
    ],
  },
  {
    group: '已登录 — 控制台',
    items: [
      {
        to: '/mocks/dashboard-empty',
        label: 'Dashboard (Empty)',
        desc: '控制台 — 新用户空状态',
      },
      {
        to: '/mocks/dashboard',
        label: 'Dashboard',
        desc: '控制台 — 有数据状态',
      },
    ],
  },
  {
    group: '已登录 — 核心流程',
    items: [
      {
        to: '/mocks/workshop',
        label: 'Workshop',
        desc: '场景工坊（提示词编辑）',
      },
      {
        to: '/mocks/leaderboard',
        label: 'Leaderboard',
        desc: '排行榜（有数据）',
      },
      {
        to: '/mocks/match',
        label: 'Match Detail',
        desc: '对战详情（完整结果）',
      },
    ],
  },
]

export function MockIndex() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-12">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-(--foreground)">
          Mock Gallery
        </h1>
        <p className="mt-2 text-sm text-(--foreground-subtle)">
          每个页面的静态 mock 版本，可以直接标注和讨论 UX 修改。数据在{' '}
          <code className="rounded bg-white/8 px-1.5 py-0.5 text-xs">
            mocks/mock-data.ts
          </code>{' '}
          中修改。
        </p>
      </div>

      {screens.map((group) => (
        <Card key={group.group}>
          <CardHeader>
            <CardTitle>{group.group}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {group.items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center justify-between rounded-xl px-4 py-3 transition hover:bg-white/4"
              >
                <div>
                  <p className="text-sm font-semibold text-(--foreground)">
                    {item.label}
                  </p>
                  <p className="text-xs text-(--foreground-muted)">
                    {item.desc}
                  </p>
                </div>
                <span className="text-xs text-(--foreground-muted)">→</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
