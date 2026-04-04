import { Accordion } from '@base-ui-components/react/accordion'
import { Checkbox } from '@base-ui-components/react/checkbox'
import { Dialog } from '@base-ui-components/react/dialog'
import { NumberField } from '@base-ui-components/react/number-field'
import { Popover } from '@base-ui-components/react/popover'
import { Progress } from '@base-ui-components/react/progress'
import { Select } from '@base-ui-components/react/select'
import { Switch } from '@base-ui-components/react/switch'
import { Tabs } from '@base-ui-components/react/tabs'
import { Toast } from '@base-ui-components/react/toast'
import { Tooltip } from '@base-ui-components/react/tooltip'
import {
  Award,
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  Loader2,
  Minus,
  Plus,
  Search,
  Shield,
  Swords,
  Trophy,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { cn } from '../lib/cn'

const NAV = [
  { id: 'buttons', num: '01', label: '按钮', en: 'Button' },
  { id: 'badges', num: '02', label: '标记', en: 'Badge' },
  { id: 'cards', num: '03', label: '卡片', en: 'Card' },
  { id: 'forms', num: '04', label: '表单', en: 'Form Controls' },
  { id: 'overlays', num: '05', label: '弹层', en: 'Overlays' },
  { id: 'navigation', num: '06', label: '导航', en: 'Navigation' },
  { id: 'feedback', num: '07', label: '反馈', en: 'Feedback' },
  { id: 'accordion', num: '08', label: '折叠', en: 'Accordion' },
]

const INPUT_CLS =
  'h-10 w-full rounded-md border border-(--border) bg-[rgba(255,255,255,0.02)] px-3 text-sm text-(--foreground) placeholder:text-(--foreground-muted) outline-none transition-colors duration-150 focus:border-(--accent) focus:ring-2 focus:ring-[rgba(224,74,47,0.4)]'

const SECTION_HDR = 'mb-8 space-y-1 border-b border-(--border-soft) pb-6'
const DEMO_AREA =
  'rounded-xl border border-(--border-soft) bg-(--surface-elevated) p-6'

function SectionHeader({
  num,
  label,
  en,
}: {
  num: string
  label: string
  en: string
}) {
  return (
    <div className={SECTION_HDR}>
      <p className="page-eyebrow">
        {num} · {label}
      </p>
      <h2 className="text-2xl font-black tracking-tight text-(--foreground)">
        {en}
      </h2>
    </div>
  )
}

function DemoGroup({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <p className="panel-label">{title}</p>
      {children}
    </div>
  )
}

function PlaygroundInner() {
  const [active, setActive] = useState('buttons')
  const [selectVal, setSelectVal] = useState('')
  const [numVal, setNumVal] = useState<number | null>(8)
  const [checks, setChecks] = useState({
    roleplay: true,
    autoJudge: false,
    multiRound: true,
  })
  const [sw, setSw] = useState({
    notifications: true,
    autoSubmit: false,
    publicProfile: true,
  })
  const [progressVal] = useState(68)
  const toastManager = Toast.useToastManager()

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting)
        if (vis.length) setActive(vis[0].target.id)
      },
      { threshold: 0.15, rootMargin: '-20% 0px -65% 0px' },
    )
    NAV.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [])

  const scrollTo = (id: string) =>
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <div className="flex min-h-[80vh] gap-10">
      {/* ── Sidebar ─────────────────────────────────── */}
      <aside className="hidden w-44 shrink-0 lg:block">
        <div className="sticky top-24 space-y-0.5">
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-(--foreground-muted)">
            组件
          </p>
          {NAV.map(({ id, num, label, en }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors duration-150',
                active === id
                  ? 'bg-[rgba(224,74,47,0.1)] text-(--foreground)'
                  : 'text-(--foreground-subtle) hover:bg-white/4 hover:text-(--foreground)',
              )}
            >
              <span
                className={cn(
                  'text-[10px] font-bold tabular-nums',
                  active === id
                    ? 'text-(--accent)'
                    : 'text-(--foreground-muted)',
                )}
              >
                {num}
              </span>
              <span className="font-medium">{label}</span>
              <span className="ml-auto hidden text-[10px] text-(--foreground-muted) xl:block">
                {en}
              </span>
            </button>
          ))}
        </div>
      </aside>

      {/* ── Main content ────────────────────────────── */}
      <div className="min-w-0 flex-1 space-y-24">
        {/* Page header */}
        <div className="space-y-3 pb-4">
          <p className="page-eyebrow">Axiia Cup · 设计系统</p>
          <h1 className="page-title">组件库</h1>
          <p className="page-subtitle text-base">
            基于 Base UI 构建的 Axiia Cup
            专属组件库，提供无障碍访问、键盘导航和样式隔离。
          </p>
        </div>

        {/* ── 01 Buttons ──────────────────────────────── */}
        <section id="buttons" className="scroll-mt-24">
          <SectionHeader num="01" label="按钮" en="Button" />
          <div className={cn(DEMO_AREA, 'space-y-8')}>
            <DemoGroup title="变体">
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">主要操作</Button>
                <Button variant="secondary">次要操作</Button>
                <Button variant="ghost">幽灵按钮</Button>
              </div>
            </DemoGroup>

            <DemoGroup title="尺寸">
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm" variant="primary">
                  小号
                </Button>
                <Button size="default" variant="primary">
                  默认
                </Button>
                <Button size="lg" variant="primary">
                  大号
                </Button>
              </div>
            </DemoGroup>

            <DemoGroup title="图标与状态">
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">
                  <Trophy className="mr-2 h-4 w-4" />
                  排行榜
                </Button>
                <Button variant="secondary">
                  <Search className="mr-2 h-4 w-4" />
                  搜索选手
                </Button>
                <Button variant="ghost">
                  <Bell className="mr-2 h-4 w-4" />
                  通知
                </Button>
                <Button variant="primary" disabled>
                  已禁用
                </Button>
                <Button variant="primary" disabled>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  处理中
                </Button>
              </div>
            </DemoGroup>
          </div>
        </section>

        {/* ── 02 Badges ───────────────────────────────── */}
        <section id="badges" className="scroll-mt-24">
          <SectionHeader num="02" label="标记" en="Badge" />
          <div className={cn(DEMO_AREA, 'space-y-8')}>
            <DemoGroup title="语义色调">
              <div className="flex flex-wrap gap-3">
                <Badge tone="accent">进行中</Badge>
                <Badge tone="success">已完成</Badge>
                <Badge tone="warning">已失败</Badge>
                <Badge tone="info">待开始</Badge>
              </div>
            </DemoGroup>

            <DemoGroup title="竞赛场景">
              <div className="flex flex-wrap gap-3">
                <Badge tone="accent">
                  <Swords className="mr-1.5 h-3 w-3" />
                  对抗赛
                </Badge>
                <Badge tone="success">
                  <Award className="mr-1.5 h-3 w-3" />
                  晋级
                </Badge>
                <Badge tone="warning">淘汰</Badge>
                <Badge tone="info">
                  <Shield className="mr-1.5 h-3 w-3" />
                  裁判
                </Badge>
                <Badge tone="accent">第 3 轮</Badge>
                <Badge tone="success">
                  <Zap className="mr-1.5 h-3 w-3" />
                  连胜
                </Badge>
              </div>
            </DemoGroup>
          </div>
        </section>

        {/* ── 03 Cards ────────────────────────────────── */}
        <section id="cards" className="scroll-mt-24">
          <SectionHeader num="03" label="卡片" en="Card" />
          <div className={cn(DEMO_AREA, 'space-y-6')}>
            <DemoGroup title="卡片变体">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Basic card */}
                <Card>
                  <CardHeader>
                    <CardTitle>标准卡片</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-(--foreground-subtle)">
                      用于展示结构化信息的通用卡片容器，支持任意内容组合。
                    </p>
                  </CardContent>
                </Card>

                {/* Stat card */}
                <Card>
                  <CardContent className="flex items-start gap-4 pt-5">
                    <div className="rounded-lg bg-[rgba(224,74,47,0.12)] p-2.5">
                      <Trophy className="h-5 w-5 text-(--accent)" />
                    </div>
                    <div>
                      <p className="panel-label">总胜场</p>
                      <p className="text-3xl font-black tracking-tight text-(--foreground)">
                        142
                      </p>
                      <p className="mt-1 text-xs text-(--success)">↑ 12 本轮</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Status card */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>当前对局</CardTitle>
                      <Badge tone="accent">进行中</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-(--foreground-subtle)">申诉方</span>
                      <span className="font-medium text-(--foreground)">
                        Agent_42
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-(--foreground-subtle)">
                        被申诉方
                      </span>
                      <span className="font-medium text-(--foreground)">
                        Agent_07
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-(--foreground-subtle)">轮次</span>
                      <Badge tone="info">第 3 轮</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </DemoGroup>
          </div>
        </section>

        {/* ── 04 Form Controls ────────────────────────── */}
        <section id="forms" className="scroll-mt-24">
          <SectionHeader num="04" label="表单" en="Form Controls" />
          <div className={cn(DEMO_AREA, 'space-y-8')}>
            {/* Text inputs */}
            <DemoGroup title="输入框">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input
                  className={INPUT_CLS}
                  placeholder="输入选手 ID..."
                  type="text"
                />
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--foreground-muted)" />
                  <input
                    className={cn(INPUT_CLS, 'pl-9')}
                    placeholder="搜索策略..."
                    type="text"
                  />
                </div>
              </div>
            </DemoGroup>

            {/* Textarea */}
            <DemoGroup title="文本域">
              <textarea
                className="w-full resize-none rounded-md border border-(--border) bg-[rgba(255,255,255,0.02)] px-3 py-2.5 text-sm text-(--foreground) placeholder:text-(--foreground-muted) outline-none transition-colors duration-150 focus:border-(--accent) focus:ring-2 focus:ring-[rgba(224,74,47,0.4)]"
                placeholder="描述你的 Agent 策略..."
                rows={3}
              />
            </DemoGroup>

            {/* Select */}
            <DemoGroup title="下拉选择 (Base UI Select)">
              <Select.Root
                value={selectVal}
                onValueChange={(v) => setSelectVal(v ?? '')}
              >
                <Select.Trigger
                  className={cn(
                    INPUT_CLS,
                    'flex cursor-pointer items-center justify-between gap-2',
                    'sm:w-64',
                  )}
                >
                  <Select.Value>
                    {(v: string | null) => v ?? '选择角色...'}
                  </Select.Value>
                  <ChevronDown className="h-4 w-4 shrink-0 text-(--foreground-muted)" />
                </Select.Trigger>
                <Select.Portal>
                  <Select.Positioner sideOffset={6}>
                    <Select.Popup className="z-50 min-w-50 overflow-hidden rounded-lg border border-(--border) bg-(--surface-elevated) py-1 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
                      <Select.List>
                        {['裁判', '申诉方', '被申诉方', '陪审团观察员'].map(
                          (item) => (
                            <Select.Item
                              key={item}
                              value={item}
                              className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-(--foreground-subtle) outline-none transition-colors data-highlighted:bg-white/5 data-highlighted:text-(--foreground) data-[selected]:text-(--foreground)"
                            >
                              <Select.ItemIndicator className="flex w-4 shrink-0 items-center justify-center text-(--accent)">
                                <Check className="h-3 w-3" strokeWidth={3} />
                              </Select.ItemIndicator>
                              <Select.ItemText>{item}</Select.ItemText>
                            </Select.Item>
                          ),
                        )}
                      </Select.List>
                    </Select.Popup>
                  </Select.Positioner>
                </Select.Portal>
              </Select.Root>
            </DemoGroup>

            {/* Number Field */}
            <DemoGroup title="数字输入 (Base UI NumberField)">
              <NumberField.Root
                value={numVal}
                onValueChange={setNumVal}
                min={1}
                max={99}
                className="w-fit"
              >
                <NumberField.Group className="flex h-10 w-36 items-stretch overflow-hidden rounded-md border border-(--border) bg-transparent text-sm text-(--foreground) transition-colors focus-within:border-(--accent) focus-within:ring-2 focus-within:ring-[rgba(224,74,47,0.4)]">
                  <NumberField.Decrement className="flex w-9 shrink-0 cursor-pointer items-center justify-center border-r border-(--border) text-(--foreground-muted) outline-none transition-colors hover:bg-white/5 hover:text-(--foreground)">
                    <Minus className="h-3 w-3" />
                  </NumberField.Decrement>
                  <NumberField.Input className="min-w-0 flex-1 bg-transparent px-2 text-center outline-none" />
                  <NumberField.Increment className="flex w-9 shrink-0 cursor-pointer items-center justify-center border-l border-(--border) text-(--foreground-muted) outline-none transition-colors hover:bg-white/5 hover:text-(--foreground)">
                    <Plus className="h-3 w-3" />
                  </NumberField.Increment>
                </NumberField.Group>
              </NumberField.Root>
            </DemoGroup>

            {/* Checkbox + Switch */}
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              <DemoGroup title="复选框 (Base UI Checkbox)">
                <div className="space-y-3">
                  {(
                    Object.entries(checks) as [keyof typeof checks, boolean][]
                  ).map(([key, val]) => {
                    const labels: Record<keyof typeof checks, string> = {
                      roleplay: '角色扮演模式',
                      autoJudge: '自动裁判评分',
                      multiRound: '多轮对话',
                    }
                    return (
                      <label
                        key={key}
                        className="flex cursor-pointer items-center gap-3 text-sm text-(--foreground-subtle) select-none"
                      >
                        <Checkbox.Root
                          checked={val}
                          onCheckedChange={(v) =>
                            setChecks((p) => ({ ...p, [key]: v as boolean }))
                          }
                          className="flex h-[18px] w-[18px] shrink-0 cursor-pointer items-center justify-center rounded-sm border border-(--border) bg-transparent outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[rgba(224,74,47,0.5)] data-[checked]:border-(--accent) data-[checked]:bg-(--accent)"
                        >
                          <Checkbox.Indicator className="flex items-center justify-center text-white">
                            <Check className="h-3 w-3" strokeWidth={3} />
                          </Checkbox.Indicator>
                        </Checkbox.Root>
                        {labels[key]}
                      </label>
                    )
                  })}
                </div>
              </DemoGroup>

              <DemoGroup title="开关 (Base UI Switch)">
                <div className="space-y-4">
                  {(Object.entries(sw) as [keyof typeof sw, boolean][]).map(
                    ([key, val]) => {
                      const labels: Record<keyof typeof sw, string> = {
                        notifications: '对局通知',
                        autoSubmit: '自动提交',
                        publicProfile: '公开资料',
                      }
                      return (
                        <label
                          key={key}
                          className="flex cursor-pointer items-center justify-between text-sm text-(--foreground-subtle) select-none"
                        >
                          {labels[key]}
                          <Switch.Root
                            checked={val}
                            onCheckedChange={(v) =>
                              setSw((p) => ({ ...p, [key]: v }))
                            }
                            className="relative inline-flex h-[22px] w-10 shrink-0 cursor-pointer rounded-full border border-(--border) bg-(--surface) outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[rgba(224,74,47,0.5)] data-checked:border-(--accent) data-checked:bg-(--accent)"
                          >
                            <Switch.Thumb className="my-auto ml-[3px] h-[14px] w-[14px] rounded-full bg-(--foreground-muted) shadow-sm transition-[transform,background-color] duration-200 data-checked:translate-x-4.5 data-checked:bg-white" />
                          </Switch.Root>
                        </label>
                      )
                    },
                  )}
                </div>
              </DemoGroup>
            </div>
          </div>
        </section>

        {/* ── 05 Overlays ─────────────────────────────── */}
        <section id="overlays" className="scroll-mt-24">
          <SectionHeader num="05" label="弹层" en="Overlays" />
          <div className={cn(DEMO_AREA, 'space-y-8')}>
            {/* Dialog */}
            <DemoGroup title="对话框 (Base UI Dialog)">
              <Dialog.Root>
                <Dialog.Trigger className="inline-flex h-10 items-center justify-center rounded-md bg-(--accent) px-4 text-sm font-semibold text-white transition duration-150 hover:bg-(--accent-hover) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(224,74,47,0.5)]">
                  打开对话框
                </Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px]" />
                  <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-(--border) bg-(--surface) p-6 shadow-[0_40px_120px_rgba(0,0,0,0.6)]">
                    <Dialog.Title className="mb-2 text-lg font-black tracking-tight text-(--foreground)">
                      确认提交策略
                    </Dialog.Title>
                    <Dialog.Description className="mb-6 text-sm text-(--foreground-subtle)">
                      你的 Agent 策略将被提交至第 3
                      轮对局。提交后本轮内无法更改，确认继续？
                    </Dialog.Description>
                    <div className="flex justify-end gap-3">
                      <Dialog.Close className="inline-flex h-10 items-center justify-center rounded-md border border-(--border) bg-transparent px-4 text-sm font-semibold text-(--foreground) transition duration-150 hover:bg-white/5">
                        取消
                      </Dialog.Close>
                      <Dialog.Close className="inline-flex h-10 items-center justify-center rounded-md bg-(--accent) px-4 text-sm font-semibold text-white transition duration-150 hover:bg-(--accent-hover)">
                        确认提交
                      </Dialog.Close>
                    </div>
                  </Dialog.Popup>
                </Dialog.Portal>
              </Dialog.Root>
            </DemoGroup>

            {/* Popover */}
            <DemoGroup title="气泡卡片 (Base UI Popover)">
              <Popover.Root>
                <Popover.Trigger className="inline-flex h-10 items-center justify-center rounded-md border border-(--border) bg-transparent px-4 text-sm font-semibold text-(--foreground) transition duration-150 hover:bg-white/5">
                  <Users className="mr-2 h-4 w-4" />
                  查看选手
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Positioner sideOffset={8}>
                    <Popover.Popup className="z-50 w-72 rounded-xl border border-(--border) bg-(--surface-elevated) p-4 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(224,74,47,0.15)] text-sm font-black text-(--accent)">
                          A7
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-(--foreground)">
                            Agent_42
                          </p>
                          <p className="text-sm text-(--foreground-subtle)">
                            胜率 73% · 第 2 种子
                          </p>
                          <div className="mt-2 flex gap-2">
                            <Badge tone="success">12 胜</Badge>
                            <Badge tone="warning">4 负</Badge>
                          </div>
                        </div>
                      </div>
                      <Popover.Close className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded text-(--foreground-muted) hover:text-(--foreground)">
                        <X className="h-3.5 w-3.5" />
                      </Popover.Close>
                    </Popover.Popup>
                  </Popover.Positioner>
                </Popover.Portal>
              </Popover.Root>
            </DemoGroup>

            {/* Tooltip */}
            <DemoGroup title="文字提示 (Base UI Tooltip)">
              <div className="flex flex-wrap gap-4">
                <Tooltip.Root>
                  <Tooltip.Trigger className="inline-flex h-10 items-center justify-center rounded-md bg-(--accent) px-4 text-sm font-semibold text-white transition duration-150 hover:bg-(--accent-hover)">
                    提交策略
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Positioner sideOffset={8}>
                      <Tooltip.Popup className="z-50 rounded-md border border-(--border) bg-(--surface-elevated) px-3 py-1.5 text-xs text-(--foreground) shadow-lg">
                        提交 Agent 策略至当前轮次
                      </Tooltip.Popup>
                    </Tooltip.Positioner>
                  </Tooltip.Portal>
                </Tooltip.Root>

                <Tooltip.Root>
                  <Tooltip.Trigger className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-(--border) bg-transparent text-(--foreground-subtle) transition hover:bg-white/5 hover:text-(--foreground)">
                    <Shield className="h-4 w-4" />
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Positioner sideOffset={8}>
                      <Tooltip.Popup className="z-50 rounded-md border border-(--border) bg-(--surface-elevated) px-3 py-1.5 text-xs text-(--foreground) shadow-lg">
                        管理员操作
                      </Tooltip.Popup>
                    </Tooltip.Positioner>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </div>
            </DemoGroup>
          </div>
        </section>

        {/* ── 06 Navigation / Tabs ────────────────────── */}
        <section id="navigation" className="scroll-mt-24">
          <SectionHeader num="06" label="导航" en="Navigation" />
          <div className={DEMO_AREA}>
            <Tabs.Root defaultValue="overview">
              <Tabs.List className="flex gap-0 border-b border-(--border-soft)">
                {[
                  { value: 'overview', label: '概览' },
                  { value: 'matches', label: '对局记录' },
                  { value: 'strategy', label: '策略分析' },
                  { value: 'settings', label: '设置' },
                ].map(({ value, label }) => (
                  <Tabs.Tab
                    key={value}
                    value={value}
                    className="relative h-10 cursor-pointer px-4 text-sm font-medium text-(--foreground-subtle) outline-none transition-colors duration-150 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-transparent after:transition-colors after:duration-150 hover:text-(--foreground) aria-selected:text-(--foreground) aria-selected:after:bg-(--accent)"
                  >
                    {label}
                  </Tabs.Tab>
                ))}
              </Tabs.List>

              <Tabs.Panel value="overview" className="pt-5">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: '总对局', val: '16', sub: '本轮' },
                    { label: '胜场', val: '12', sub: '75% 胜率' },
                    { label: '当前排名', val: '#3', sub: '种子位' },
                  ].map((s) => (
                    <div key={s.label} className="space-y-1">
                      <p className="panel-label">{s.label}</p>
                      <p className="text-2xl font-black tracking-tight text-(--foreground)">
                        {s.val}
                      </p>
                      <p className="text-xs text-(--foreground-muted)">
                        {s.sub}
                      </p>
                    </div>
                  ))}
                </div>
              </Tabs.Panel>

              <Tabs.Panel value="matches" className="pt-5">
                <div className="space-y-2">
                  {[
                    { opp: 'Agent_07', result: 'win', score: '3-1' },
                    { opp: 'Agent_19', result: 'win', score: '2-0' },
                    { opp: 'Agent_33', result: 'loss', score: '1-2' },
                  ].map((m, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border border-(--border-soft) px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-(--foreground-muted)" />
                        <span className="text-sm font-medium text-(--foreground)">
                          对阵 {m.opp}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-(--foreground-subtle)">
                          {m.score}
                        </span>
                        <Badge
                          tone={m.result === 'win' ? 'success' : 'warning'}
                        >
                          {m.result === 'win' ? '胜' : '负'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Tabs.Panel>

              <Tabs.Panel value="strategy" className="pt-5">
                <p className="text-sm text-(--foreground-subtle)">
                  策略分析图表将在此显示，包括角色偏好、论点强度和裁判评分分布。
                </p>
              </Tabs.Panel>

              <Tabs.Panel value="settings" className="pt-5">
                <p className="text-sm text-(--foreground-subtle)">
                  选手设置选项，包括 Agent 配置和通知偏好。
                </p>
              </Tabs.Panel>
            </Tabs.Root>
          </div>
        </section>

        {/* ── 07 Feedback ─────────────────────────────── */}
        <section id="feedback" className="scroll-mt-24">
          <SectionHeader num="07" label="反馈" en="Feedback" />
          <div className={cn(DEMO_AREA, 'space-y-8')}>
            {/* Progress */}
            <DemoGroup title="进度条 (Base UI Progress)">
              <div className="space-y-4">
                {[
                  {
                    label: '对局完成度',
                    val: progressVal,
                    tone: 'accent' as const,
                  },
                  { label: '胜率', val: 75, tone: 'success' as const },
                  { label: '评分进度', val: 32, tone: 'info' as const },
                ].map(({ label, val, tone }) => {
                  const colors = {
                    accent: 'bg-(--accent)',
                    success: 'bg-(--success)',
                    info: 'bg-(--info)',
                  }
                  return (
                    <div key={label} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="panel-label">{label}</span>
                        <span className="text-xs font-semibold text-(--foreground-subtle)">
                          {val}%
                        </span>
                      </div>
                      <Progress.Root
                        value={val}
                        className="h-2 w-full overflow-hidden rounded-full bg-(--surface)"
                      >
                        <Progress.Track className="h-full w-full">
                          <Progress.Indicator
                            className={cn(
                              'h-full rounded-full transition-[width] duration-700 ease-out',
                              colors[tone],
                            )}
                          />
                        </Progress.Track>
                      </Progress.Root>
                    </div>
                  )
                })}
              </div>
            </DemoGroup>

            {/* Toast */}
            <DemoGroup title="消息通知 (Base UI Toast)">
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="primary"
                  onClick={() =>
                    toastManager.add({
                      title: '策略已提交',
                      description: '你的 Agent 已进入第 3 轮对局队列。',
                      timeout: 4000,
                    })
                  }
                >
                  <Bell className="mr-2 h-4 w-4" />
                  成功通知
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    toastManager.add({
                      title: '对局结果',
                      description:
                        'Agent_42 以 2-1 击败 Agent_07，晋级下一轮。',
                      timeout: 5000,
                    })
                  }
                >
                  <Trophy className="mr-2 h-4 w-4" />
                  对局通知
                </Button>
                <Button
                  variant="ghost"
                  onClick={() =>
                    toastManager.add({
                      title: '策略更新',
                      description: '当前轮次截止前可更新一次策略。',
                      timeout: 3000,
                    })
                  }
                >
                  <Zap className="mr-2 h-4 w-4" />
                  提示
                </Button>
              </div>
            </DemoGroup>
          </div>
        </section>

        {/* ── 08 Accordion ────────────────────────────── */}
        <section id="accordion" className="scroll-mt-24 pb-16">
          <SectionHeader num="08" label="折叠" en="Accordion" />
          <div className={DEMO_AREA}>
            <Accordion.Root
              defaultValue={['rules']}
              className="space-y-0 divide-y divide-(--border-soft)"
            >
              {[
                {
                  value: 'rules',
                  title: '比赛规则',
                  content:
                    'Axiia Cup 采用瑞士轮制赛制，每位选手提交一个 AI Agent 参与辩论对抗。每场对局包含多轮对话阶段和裁判评分环节，最终由评分模型判定胜负。',
                },
                {
                  value: 'roles',
                  title: '角色说明',
                  content:
                    '每场对局中，两名 Agent 分别扮演申诉方与被申诉方。裁判 Agent 独立评估双方论点的逻辑性、说服力和完整性，不受参赛方影响。',
                },
                {
                  value: 'scoring',
                  title: '评分标准',
                  content:
                    '裁判从逻辑严密性、论据充分性、回应相关性三个维度进行评分。每个维度满分 10 分，综合得分决定单场胜负，系列赛采用 Best-of-3 制度。',
                },
                {
                  value: 'submission',
                  title: '策略提交',
                  content:
                    '每轮对局开始前，选手可在工坊页面更新 Agent 策略提示词。提交截止后锁定，支持版本历史回溯。每轮最多提交 3 次，取最后一次有效。',
                },
              ].map(({ value, title, content }) => (
                <Accordion.Item key={value} value={value} className="py-0">
                  <Accordion.Header>
                    <Accordion.Trigger className="flex w-full cursor-pointer items-center justify-between gap-4 py-4 text-left text-sm font-semibold text-(--foreground-subtle) outline-none transition-colors duration-150 hover:text-(--foreground) data-[panel-open]:text-(--foreground)">
                      {title}
                      <ChevronRight className="h-4 w-4 shrink-0 text-(--foreground-muted) transition-transform duration-200 data-[panel-open]:rotate-90" />
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Panel className="overflow-hidden">
                    <p className="pb-4 text-sm leading-relaxed text-(--foreground-subtle)">
                      {content}
                    </p>
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
            </Accordion.Root>
          </div>
        </section>
      </div>

      {/* ── Toast Viewport ───────────────────────────── */}
      <Toast.Portal>
        <Toast.Viewport className="fixed right-4 bottom-4 z-[100] flex w-80 flex-col gap-2 outline-none">
          {toastManager.toasts.map((toast) => (
            <Toast.Root
              key={toast.id}
              toast={toast}
              className="flex items-start gap-3 rounded-xl border border-(--border) bg-(--surface-elevated) p-4 shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
            >
              <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-(--accent)" />
              <Toast.Content className="min-w-0 flex-1">
                <Toast.Title className="text-sm font-semibold text-(--foreground)" />
                <Toast.Description className="mt-0.5 text-xs text-(--foreground-subtle)" />
              </Toast.Content>
              <Toast.Close
                className="shrink-0 text-(--foreground-muted) transition-colors hover:text-(--foreground)"
                onClick={() => toastManager.close(toast.id)}
              >
                <X className="h-3.5 w-3.5" />
              </Toast.Close>
            </Toast.Root>
          ))}
        </Toast.Viewport>
      </Toast.Portal>
    </div>
  )
}

export default function ComponentPlaygroundPage() {
  return (
    <Toast.Provider>
      <Tooltip.Provider>
        <PlaygroundInner />
      </Tooltip.Provider>
    </Toast.Provider>
  )
}
