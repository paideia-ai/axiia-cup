import { ArrowRight, Shield, Swords, Trophy } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

const highlights = [
  {
    title: "双角色提交",
    description: "每个场景必须同时提交角色 A / B 两份策略提示词，保证真正的对称博弈。",
    icon: Shield,
  },
  {
    title: "裁判公开",
    description: "裁判规则和角色人设可见，选手围绕公开规则持续优化策略。",
    icon: Swords,
  },
  {
    title: "瑞士轮排名",
    description: "MVP 采用 4 轮瑞士制，按胜场与 Buchholz 小分排序，强调长期收敛。",
    icon: Trophy,
  },
];

export function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(224,74,47,0.18),transparent_28%),linear-gradient(180deg,#111_0%,#0c0c0c_38%,#090909_100%)]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-8 sm:px-6">
        <header className="flex items-center justify-between py-4">
          <div className="text-sm font-black tracking-[0.24em] text-[var(--accent)]">AXIIA CUP</div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-[var(--foreground-subtle)] hover:text-[var(--foreground)]">
              登录
            </Link>
            <Link to="/register">
              <Button size="sm">注册</Button>
            </Link>
          </div>
        </header>

        <section className="flex flex-1 flex-col justify-center py-16">
          <div className="max-w-4xl">
            <Badge tone="info" className="mb-6">
              MVP · 内部 15 人测试
            </Badge>
            <h1 className="max-w-4xl text-5xl font-black leading-[0.94] tracking-[-0.06em] text-white md:text-7xl">
              为人文学科
              <span className="block text-[var(--accent)]">设计会赢的 AI 对手</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[var(--foreground-subtle)] md:text-lg">
              选手不拼工具链，不拼外挂工作流，只拼策略提示词设计、角色理解与对抗策略。平台先搭骨架，流程先跑通。
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link to="/scenarios">
                <Button size="lg">
                  进入框架
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <div className="inline-flex items-center rounded-md border border-[var(--border)] px-4 py-3 text-sm text-[var(--foreground-subtle)]">
                根目录保留 `index.html` / `app.html` 作为旧参考
              </div>
            </div>
          </div>

          <div className="mt-14 grid gap-4 lg:grid-cols-3">
            {highlights.map((item) => (
              <Card key={item.title} className="bg-[rgba(22,22,22,0.9)]">
                <CardContent className="space-y-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[rgba(224,74,47,0.12)] text-[var(--accent)]">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">{item.title}</h2>
                    <p className="mt-2 text-sm leading-7 text-[var(--foreground-subtle)]">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
