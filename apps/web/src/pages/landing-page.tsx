import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { IcpRecord } from '../components/layout/icp-record'
import { useAuth } from '../context/auth'

const steps = [
  {
    n: '01',
    title: '编写提示词',
    description:
      '给你的 AI 角色写一段策略指引（不超过 1000 字），告诉它辩论时怎么赢。',
  },
  {
    n: '02',
    title: '自动对战',
    description:
      '你的 AI 会自动和其他玩家的 AI 一对一辩论，裁判 AI 打分定胜负。',
  },
  {
    n: '03',
    title: '排行竞技',
    description: '每轮多场比赛积累排名，看看谁的策略最强。',
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
            className="text-sm font-black tracking-[0.24em] text-(--accent)"
          >
            AXIIA CUP
          </Link>
          <div className="flex items-center gap-3">
            {isLoading ? (
              <div className="text-sm text-(--foreground-subtle)">
                正在恢复会话...
              </div>
            ) : user ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-sm text-(--foreground-subtle) hover:text-(--foreground)"
                >
                  控制台
                </Link>
                <Link to="/scenarios">
                  <Button size="sm">进入工坊</Button>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm text-(--foreground-subtle) hover:text-(--foreground)"
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
            <h1 className="text-5xl font-black leading-20 tracking-[-0.06em] text-white md:text-7xl">
              用提示词打造
              <span className="block text-(--accent)">最强对话智能体</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-(--foreground-subtle) md:text-lg">
              Axiia Cup 是一个面向人文学科的 AI
              智能体对抗赛。编写你的系统提示词，让两个 AI
              在历史、法律、戏剧场景中展开博弈。
            </p>
            <div className="mt-10 flex justify-center gap-4">
              {user ? (
                <Link to="/dashboard">
                  <Button size="lg">
                    进入控制台
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : !isLoading ? (
                <>
                  <Link to="/register">
                    <Button size="lg">
                      立即注册
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button size="lg" variant="secondary">
                      已有账户，登录
                    </Button>
                  </Link>
                </>
              ) : null}
            </div>
          </div>

          <div className="mt-16 grid w-full max-w-5xl divide-y divide-[rgba(255,255,255,0.07)] text-left lg:grid-cols-3 lg:divide-x lg:divide-y-0">
            {steps.map((step) => (
              <div key={step.n} className="px-8 py-6 first:pl-0 last:pr-0">
                <p className="text-[2.5rem] font-black leading-none tracking-[-0.05em] text-[rgba(224,74,47,0.22)]">
                  {step.n}
                </p>
                <h2 className="mt-4 text-base font-semibold text-white">
                  {step.title}
                </h2>
                <p className="mt-2 text-sm leading-7 text-(--foreground-subtle)">
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/matches/277"
              className="text-sm font-medium text-(--accent) transition hover:opacity-80"
            >
              先看一场真实对局 →
            </Link>
          </div>
        </section>

        <footer className="py-4">
          <IcpRecord />
        </footer>
      </div>
    </div>
  )
}
