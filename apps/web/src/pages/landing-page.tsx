import { ArrowRight, FilePenLine, Swords, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { useAuth } from '../context/auth'

const highlights = [
  {
    title: '编写提示词',
    description:
      '为两个对立角色各写一份系统提示词，每份不超过 1000 字，围绕公开规则持续优化策略。',
    icon: FilePenLine,
  },
  {
    title: '自动对战',
    description:
      '你的智能体会自动进入多轮对抗，平台负责拼接场景材料、裁判追问和结果判定。',
    icon: Swords,
  },
  {
    title: '排行竞技',
    description:
      '瑞士轮赛制按胜场和小分排序，强调长期稳定收敛，而不是单场运气。',
    icon: Trophy,
  },
]

export function LandingPage() {
  const { isLoading, user } = useAuth()

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(224,74,47,0.18),transparent_28%),linear-gradient(180deg,#111_0%,#0c0c0c_38%,#090909_100%)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(224,74,47,0.08),transparent_24%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.04),transparent_18%)]" />
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-8 sm:px-6">
        <header className="flex items-center justify-between py-4">
          <Link
            to="/"
            className="text-sm font-black tracking-[0.24em] text-[var(--accent)]"
          >
            AXIIA CUP
          </Link>
          <div className="flex items-center gap-3">
            {isLoading ? (
              <div className="text-sm text-[var(--foreground-subtle)]">
                正在恢复会话...
              </div>
            ) : user ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-sm text-[var(--foreground-subtle)] hover:text-[var(--foreground)]"
                >
                  控制台
                </Link>
                <Link to="/scenarios/shangyang-court">
                  <Button size="sm">进入工坊</Button>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm text-[var(--foreground-subtle)] hover:text-[var(--foreground)]"
                >
                  登录
                </Link>
                <Link to="/register">
                  <Button size="sm">注册</Button>
                </Link>
              </>
            )}
          </div>
        </header>

        <section className="relative flex flex-1 flex-col items-center justify-center py-16 text-center">
          <div className="max-w-4xl">
            <Badge tone="success" className="mb-8">
              第一赛季报名中
            </Badge>
            <h1 className="text-5xl font-black leading-[0.94] tracking-[-0.06em] text-white md:text-7xl">
              用提示词打造
              <span className="block text-[var(--accent)]">最强对话智能体</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[var(--foreground-subtle)] md:text-lg">
              Axiia Cup 是一个面向人文学科的 AI
              智能体对抗赛。编写你的系统提示词，让两个 AI
              在历史、法律、戏剧场景中展开博弈。
            </p>
            {user ? (
              <div className="mt-10 flex justify-center">
                <Link to="/dashboard">
                  <Button
                    size="lg"
                    className="h-14 rounded-xl px-8 text-lg shadow-[0_0_32px_rgba(224,74,47,0.28)]"
                  >
                    进入控制台
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ) : null}
          </div>

          <div className="mt-16 grid w-full max-w-5xl gap-4 text-left lg:grid-cols-3">
            {highlights.map((item) => (
              <Card
                key={item.title}
                className="border-[var(--border)] bg-[rgba(22,22,22,0.92)]"
              >
                <CardContent className="space-y-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[rgba(224,74,47,0.12)] text-[var(--accent)]">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      {item.title}
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-[var(--foreground-subtle)]">
                      {item.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
