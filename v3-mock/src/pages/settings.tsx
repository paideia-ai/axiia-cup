// K — 设置（B6）：账户、邀请码状态、通知偏好、我的 agents；
// 附 mock-only 演示控制（非产品功能）。
import { ArrowRight, Bot, FlaskConical, RotateCcw } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge, Button, Card, KeyValue } from '../components/ui'
import { cn } from '../lib/cn'
import { sideRoleShort } from '../mock/data'
import { SCENARIOS, store, useAppState } from '../mock/store'
import type { Agent } from '../mock/types'

function scenarioName(id: string): string {
  return SCENARIOS.find((s) => s.id === id)?.name ?? id
}

/** agent 名天然含侧（#63）：侧角色名 + 自起名 */
function agentRole(a: Agent): string {
  const sc = SCENARIOS.find((s) => s.id === a.scenarioId)
  return sc ? sideRoleShort(sc, a.side) : `执${a.side}`
}

function Toggle({ on, onClick, disabled }: { on: boolean; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      type='button'
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'relative h-6 w-11 rounded-full border transition',
        on ? 'border-(--accent) bg-(--accent)/70' : 'border-(--border) bg-white/6',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white transition-all',
          on ? 'left-[22px]' : 'left-0.5',
        )}
      />
    </button>
  )
}

export function SettingsPage() {
  const { user, agents, trialsBlocked } = useAppState()
  const myAgents = agents.filter((a) => a.ownerId === user?.id)

  return (
    <div className='flex flex-col gap-6'>
      <div>
        <p className='page-eyebrow'>K · 设置</p>
        <h1 className='page-title'>设置</h1>
      </div>

      <div className='grid gap-4 lg:grid-cols-2'>
        <Card className='flex flex-col gap-4'>
          <p className='panel-label'>账户</p>
          <KeyValue label='昵称'>{user?.name}</KeyValue>
          <KeyValue label='邮箱'>{user?.email}</KeyValue>
          <KeyValue label='邀请码状态'>
            <Badge tone='success'>已通过邀请码注册</Badge>
          </KeyValue>
        </Card>

        <Card className='flex flex-col gap-4'>
          <p className='panel-label'>通知偏好</p>
          <div className='flex items-center justify-between gap-4'>
            <div>
              <p className='text-sm font-semibold text-(--foreground)'>站内通知</p>
              <p className='text-xs text-(--foreground-subtle)'>alpha 唯一通知渠道，始终开启。</p>
            </div>
            <Toggle on disabled />
          </div>
          {/* (#18) 未完成的控件完全隐藏——站外渠道只作文字说明，不渲染禁用开关 */}
          <p className='border-t border-(--border-soft) pt-3 text-xs text-(--foreground-muted)'>
            站外渠道（email / 飞书）：future feature
          </p>
        </Card>
      </div>

      <Card>
        <div className='flex items-center justify-between'>
          <p className='panel-label'>
            <Bot className='mr-1 inline h-3.5 w-3.5' />
            我的 agents
          </p>
          <Link to='/history' className='text-xs text-(--foreground-muted) underline-offset-2 transition hover:text-(--foreground) hover:underline'>
            全部对战历史 →
          </Link>
        </div>
        {myAgents.length === 0 ? (
          <p className='panel-copy text-sm'>还没有 agent——去场景页构建一个。</p>
        ) : (
          <ul className='flex flex-col divide-y divide-(--border-soft)'>
            {myAgents.map((a) => (
              <li key={a.id}>
                <Link to={`/agents/${a.id}`} className='flex items-center gap-3 py-3 transition hover:bg-white/[0.03]'>
                  <div className='min-w-0 flex-1'>
                    <p className='text-sm font-semibold text-(--foreground)'>
                      {agentRole(a)} · {a.name}
                    </p>
                    <p className='text-xs text-(--foreground-subtle)'>
                      {scenarioName(a.scenarioId)} · 执{a.side} · {a.versions.length} 个版本
                      {a.tournamentVersionId && ' · 已标记本侧参赛版本'}
                    </p>
                  </div>
                  <ArrowRight className='h-4 w-4 text-(--foreground-muted)' />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className='border-dashed'>
        <p className='panel-label'>
          <FlaskConical className='mr-1 inline h-3.5 w-3.5' />
          演示控制
        </p>
        <p className='mb-4 text-xs text-(--foreground-muted)'>Mock 演示控制，非产品功能。</p>
        <div className='flex flex-col gap-4'>
          {/* (#47) 赛事运行期间可阻挡全部试炼——规格行为，mock 用开关模拟 */}
          <div className='flex items-center justify-between gap-4'>
            <div>
              <p className='text-sm font-semibold text-(--foreground)'>赛事运行期间阻挡试炼</p>
              <p className='text-xs text-(--foreground-subtle)'>开启后所有派发被拒绝（模拟赛事运行状态）。</p>
            </div>
            <Toggle on={trialsBlocked} onClick={() => store.toggleTrialsBlocked()} />
          </div>
          <div className='flex items-center justify-between gap-4 border-t border-(--border-soft) pt-4'>
            <div>
              <p className='text-sm font-semibold text-(--foreground)'>重置演示数据</p>
              <p className='text-xs text-(--foreground-subtle)'>清空本地状态，恢复种子数据。</p>
            </div>
            <Button size='sm' variant='danger' onClick={() => store.resetAll()}>
              <RotateCcw className='h-4 w-4' />
              重置
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
