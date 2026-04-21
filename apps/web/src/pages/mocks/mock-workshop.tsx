/** Static mock: Workshop (ScenarioDetail) — with quick-start card, prompt editor, version history */
import { FlaskConical, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { Accordion, AccordionItem } from '../../components/ui/accordion'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'
import { ScrollArea } from '../../components/ui/scroll-area'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../components/ui/tabs'
import { Textarea } from '../../components/ui/textarea'
import { mockScenario, mockSubmissions } from './mock-data'

function RoleCard({
  roleName,
  hiddenInfo,
  requests,
  side,
}: {
  roleName: string
  hiddenInfo: { id: string; content: string }[]
  requests: { id: string; content: string }[]
  side: 'a' | 'b'
}) {
  const accentColor = side === 'a' ? 'var(--accent)' : 'var(--info)'
  return (
    <div className="space-y-3 rounded-xl border border-(--border-soft) bg-white/2 p-4">
      <p className="text-sm font-semibold" style={{ color: accentColor }}>
        {roleName}
      </p>
      {hiddenInfo.length > 0 ? (
        <div>
          <p className="mb-1.5 text-xs font-medium text-(--foreground-muted)">
            隐藏信息（{hiddenInfo.length} 条，比赛时随机指定真假）
          </p>
          <ul className="space-y-1">
            {hiddenInfo.map((item) => (
              <li
                key={item.id}
                className="text-xs leading-5 text-(--foreground-subtle) pl-2.5 border-l-2 border-(--border-soft)"
              >
                <span className="mr-1 text-(--foreground-muted)">
                  [{item.id}]
                </span>
                {item.content}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {requests.length > 0 ? (
        <div>
          <p className="mb-1.5 text-xs font-medium text-(--foreground-muted)">
            诉求清单（{requests.length} 条，比赛时随机选取真诉求）
          </p>
          <ul className="space-y-1">
            {requests.map((item) => (
              <li
                key={item.id}
                className="text-xs leading-5 text-(--foreground-subtle) pl-2.5 border-l-2 border-(--border-soft)"
              >
                <span className="mr-1 text-(--foreground-muted)">
                  [{item.id}]
                </span>
                {item.content}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

export function MockWorkshop() {
  const [showQuickStart, setShowQuickStart] = useState(true)
  const s = mockScenario

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="page-eyebrow">场景工坊</p>
          <h1 className="page-title">{s.title}</h1>
          <p className="page-subtitle">写一段策略让你的 AI 在辩论中胜出</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>{s.subject}</Badge>
          <Badge tone="info">{s.turnCount} 回合</Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Left: Scene Materials ── */}
        <div className="order-2 lg:order-1 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)]">
          <ScrollArea className="h-full">
            <Card>
              <CardContent className="space-y-3">
                <Accordion multiple defaultValue={['roles']}>
                  <AccordionItem value="roles" title="角色详情">
                    <div className="space-y-3">
                      <RoleCard
                        roleName={s.roleAName}
                        hiddenInfo={s.roleAHiddenInfo}
                        requests={s.roleARequests}
                        side="a"
                      />
                      <RoleCard
                        roleName={s.roleBName}
                        hiddenInfo={s.roleBHiddenInfo}
                        requests={s.roleBRequests}
                        side="b"
                      />
                    </div>
                  </AccordionItem>

                  <AccordionItem value="scoring" title="机制参数">
                    <div className="space-y-3 text-xs leading-5 text-(--foreground-subtle)">
                      <div className="flex flex-wrap gap-2">
                        <div className="rounded-lg border border-(--border-soft) bg-white/3 px-3 py-2">
                          <p className="text-[11px] text-(--foreground-muted)">
                            对话回合
                          </p>
                          <p className="text-base font-semibold text-(--foreground)">
                            {s.turnCount}
                          </p>
                        </div>
                        <div className="rounded-lg border border-(--border-soft) bg-white/3 px-3 py-2">
                          <p className="text-[11px] text-(--foreground-muted)">
                            虚假信息数
                          </p>
                          <p className="text-base font-semibold text-(--foreground)">
                            {s.falseInfoCount}
                          </p>
                        </div>
                        <div className="rounded-lg border border-(--border-soft) bg-white/3 px-3 py-2">
                          <p className="text-[11px] text-(--foreground-muted)">
                            真诉求数
                          </p>
                          <p className="text-base font-semibold text-(--foreground)">
                            {s.trueRequestCount}
                          </p>
                        </div>
                      </div>
                    </div>
                  </AccordionItem>

                  <AccordionItem value="more-rules" title="更多规则">
                    <Accordion multiple>
                      <AccordionItem value="flow" title="比赛流程">
                        <ol className="space-y-2 text-xs leading-5 text-(--foreground-subtle) list-decimal list-inside">
                          <li>
                            <span className="font-medium text-(--foreground)">
                              对话阶段
                            </span>
                            ：双方进行 {s.turnCount} 轮对话
                          </li>
                          <li>
                            <span className="font-medium text-(--foreground)">
                              问询阶段
                            </span>
                            ：裁判分别向双方提问
                          </li>
                          <li>
                            <span className="font-medium text-(--foreground)">
                              裁决阶段
                            </span>
                            ：裁判综合辩论内容做出最终裁决
                          </li>
                          <li>
                            <span className="font-medium text-(--foreground)">
                              计分阶段
                            </span>
                            ：系统根据裁决结果计算双方得分
                          </li>
                        </ol>
                      </AccordionItem>
                      <AccordionItem value="judge" title="裁判的视角与判决逻辑">
                        <p className="whitespace-pre-wrap text-xs leading-5 text-(--foreground-subtle)">
                          {s.judgePrompt}
                        </p>
                      </AccordionItem>
                    </Accordion>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </ScrollArea>
        </div>

        {/* ── Right: Prompt Editor + Version History ── */}
        <div className="order-1 space-y-6 lg:order-2">
          <Card>
            <CardHeader className="flex flex-col gap-3 border-none pb-0">
              <CardTitle>编写策略提示词</CardTitle>
              <p className="text-sm leading-6 text-(--foreground-subtle)">
                保存后可在试炼场测试效果，比赛前自动使用最新版本。
              </p>
            </CardHeader>
            {showQuickStart && (
              <div className="mx-6 mt-4 flex items-start gap-3 rounded-lg border border-[rgba(74,222,128,0.2)] bg-[rgba(74,222,128,0.06)] px-4 py-3">
                <div className="min-w-0 flex-1 space-y-1 text-xs leading-5 text-(--foreground-subtle)">
                  <p className="font-semibold text-(--foreground)">快速上手</p>
                  <p>
                    你的{s.roleAName}会对阵别人的{s.roleBName}，你的
                    {s.roleBName}
                    会对阵别人的{s.roleAName}。写一段策略告诉 AI
                    怎么赢得辩论，100 字就够开始。
                  </p>
                  <Link
                    to="/mocks/leaderboard"
                    className="inline-block text-xs font-medium text-(--accent) hover:opacity-80"
                  >
                    去排行榜看看别人怎么打的 →
                  </Link>
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded p-1 text-(--foreground-muted) transition hover:bg-white/8 hover:text-(--foreground)"
                  onClick={() => setShowQuickStart(false)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <CardContent>
              <form className="grid gap-4" onSubmit={(e) => e.preventDefault()}>
                <p className="text-xs text-(--foreground-muted) leading-5">
                  你需要同时编写{s.roleAName}和{s.roleBName}的策略。比赛时你的
                  {s.roleAName}会对阵别人的{s.roleBName}，你的{s.roleBName}
                  会对阵别人的{s.roleAName}。
                </p>
                <Tabs defaultValue="a">
                  <TabsList>
                    <TabsTrigger value="a">{s.roleAName}</TabsTrigger>
                    <TabsTrigger value="b">{s.roleBName}</TabsTrigger>
                  </TabsList>
                  <TabsContent value="a" className="space-y-3">
                    <div className="rounded-lg border border-(--border-soft) px-3">
                      <Accordion defaultValue={[]}>
                        <AccordionItem
                          value="template"
                          title="系统预设角色提示词"
                        >
                          <pre className="whitespace-pre-wrap text-[11px] leading-5 text-(--foreground-subtle) font-mono">
                            你是商鞅，正在秦孝公面前与甘龙辩论……
                          </pre>
                        </AccordionItem>
                      </Accordion>
                    </div>
                    <Textarea
                      className="min-h-55"
                      placeholder="例如：在辩论中强调变法对军事力量的具体提升，用历史战例作为论据…"
                      defaultValue="你是商鞅，在辩论中强调变法对军事力量的具体提升，用河西之战的惨败作为论据……"
                    />
                  </TabsContent>
                  <TabsContent value="b" className="space-y-3">
                    <div className="rounded-lg border border-(--border-soft) px-3">
                      <Accordion defaultValue={[]}>
                        <AccordionItem
                          value="template"
                          title="系统预设角色提示词"
                        >
                          <pre className="whitespace-pre-wrap text-[11px] leading-5 text-(--foreground-subtle) font-mono">
                            你是甘龙，正在秦孝公面前与商鞅辩论……
                          </pre>
                        </AccordionItem>
                      </Accordion>
                    </div>
                    <Textarea
                      className="min-h-55 mb-6"
                      placeholder="例如：强调祖制的稳定性，质疑对手方案的可行性和成本…"
                      defaultValue="你是甘龙，以楚国变法失败为切入点，强调渐进改良的重要性……"
                    />
                  </TabsContent>
                </Tabs>
                <Button type="submit">保存版本</Button>
                <p className="text-center text-[11px] text-(--foreground-muted)">
                  不同模型影响 AI
                  的表达风格和推理深度。你可以随时修改，比赛前自动使用最新版本。
                </p>
              </form>
            </CardContent>
          </Card>

          {/* Version History */}
          <Card>
            <CardHeader>
              <CardTitle>版本历史</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className="rounded-xl border border-(--border-soft) bg-white/2 px-4 py-3"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="shrink-0 font-semibold text-(--foreground)">
                        v{sub.version}
                      </p>
                      <Badge
                        tone="accent"
                        className="shrink-0 whitespace-nowrap"
                      >
                        {s.roleAName} · DeepSeek-V3
                      </Badge>
                      <Badge tone="info" className="shrink-0 whitespace-nowrap">
                        {s.roleBName} · DeepSeek-V3
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="whitespace-nowrap text-xs text-(--foreground-muted)">
                        {sub.createdAt}
                      </span>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="shrink-0 whitespace-nowrap"
                      >
                        <FlaskConical className="mr-1.5 h-3.5 w-3.5" />
                        前往试炼场
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
