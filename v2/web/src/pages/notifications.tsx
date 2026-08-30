import { CheckCheck, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { ApiError, notifications } from '../api/client'
import type { NotificationDTO } from '../api/types'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { messageOf, useAsync } from '../lib/use-async'
import { tm } from '../testmode/mark'

// 通知页（B5/G25，mock 通知页样式）：按 kind 分组（PVP/锦标赛 优先于
// PVE/系统）、渲染服务端 title/body（缺席回落本地 kind 文案）、link 深链、
// 全部已读 + 清除（走新端点，老服务器 404 → 就地提示）。铃铛 SSE 与未读
// 徽章行为不变。

// #53 通知 kind 的中文标签（服务端 title 缺席时的回落）。
const KIND_LABEL: Record<string, string> = {
  battle_finished: '对战结束',
  challenged: '被约战',
  automatch_result: '自动匹配结果',
  tournament_round: '锦标赛进程',
  tournament_invite: '锦标赛资格',
  gate_unlocked: '门槛达成',
  entry_version_reminder: '参赛版本提醒',
  announcement: '系统公告',
}

// #53 优先级分组：PVP/锦标赛 > PVE/系统；未知 kind 归 PVE/系统。
const PVP_KINDS = new Set([
  'challenged',
  'automatch_result',
  'tournament_round',
  'tournament_invite',
])

function kindLabel(kind: string): string {
  return KIND_LABEL[kind] ?? kind
}

// 深链优先服务端 link（SPA 路径）；老服务器回落 matchID 拼链。
function linkOf(notification: NotificationDTO): string | null {
  if (notification.link) return notification.link
  if (notification.matchID != null) return `/matches/${notification.matchID}`
  return null
}

// 端点缺席（老服务器 404/405，非 JSON 错误体解析为 unknown）→ 功能提示。
function isMissingEndpoint(cause: unknown): boolean {
  return cause instanceof ApiError &&
    (cause.status === 404 || cause.status === 405) &&
    cause.code === 'unknown'
}

// round4 评审 #5：本地不再镜像服务端列表——只记录三种乐观「变更」（逐条
// 已读 / 全部已读 / 已清空），rows 与未读数从 data + 变更派生，没有双份
// 状态可分叉，也没有同步 effect 造成的「暂无通知」闪帧。变更对新数据幂等
// （重取后命中的行本就已读），失败路径在 reload() 前撤销对应变更即可与
// 服务端对齐。
interface NotificationMutations {
  readIDs: ReadonlySet<number>
  allRead: boolean
  cleared: boolean
}

const NO_MUTATIONS: NotificationMutations = {
  readIDs: new Set(),
  allRead: false,
  cleared: false,
}

export function NotificationsPage() {
  const { data, error, loading, reload } = useAsync(
    () => notifications.list(),
    [],
  )
  const [actionError, setActionError] = useState<string | null>(null)
  const [acting, setActing] = useState(false)
  const [mutations, setMutations] = useState<NotificationMutations>(
    NO_MUTATIONS,
  )

  // F3：行内操作走乐观更新——成功路径不再重取整页，列表不卸载，滚动位置
  // 即不丢（scroll.ts 的原则：refetch 不是导航，不该移动页面）。铃铛角标
  // 仍由 SSE /notifications/bell 独立对齐。
  const rows = useMemo<NotificationDTO[]>(() => {
    if (data == null || mutations.cleared) return []
    return data.notifications.map((row) =>
      !row.read && (mutations.allRead || mutations.readIDs.has(row.id))
        ? { ...row, read: true }
        : row
    )
  }, [data, mutations])
  const unread = rows.filter((row) => !row.read).length

  const markRead = async (id: number) => {
    const target = rows.find((row) => row.id === id)
    if (target == null || target.read) return
    // 乐观置已读：先记变更，失败撤销该条并提示、reload() 与服务端对齐。
    setMutations((current) => ({
      ...current,
      readIDs: new Set(current.readIDs).add(id),
    }))
    try {
      await notifications.markRead(id)
    } catch {
      setMutations((current) => {
        const readIDs = new Set(current.readIDs)
        readIDs.delete(id)
        return { ...current, readIDs }
      })
      setActionError('标记失败，请重试')
      reload()
    }
  }

  // 深链点击顺手标已读：即将导航离开，fire-and-forget 即可。
  const follow = (notification: NotificationDTO) => {
    if (!notification.read) {
      void notifications.markRead(notification.id).catch(() => {})
    }
  }

  const readAll = async () => {
    setActing(true)
    setActionError(null)
    // 乐观全读：失败撤销变更、保留端点缺席回退文案并 reload() 对齐。
    setMutations((current) => ({ ...current, allRead: true }))
    try {
      await notifications.readAll()
    } catch (cause) {
      setMutations((current) => ({ ...current, allRead: false }))
      setActionError(
        isMissingEndpoint(cause)
          ? '服务器版本暂不支持「全部已读」——可逐条标为已读'
          : messageOf(cause, '全部已读失败'),
      )
      reload()
    } finally {
      setActing(false)
    }
  }

  const clearAll = async () => {
    // 清除是破坏性动作：先确认再发。
    if (!globalThis.confirm('清空全部通知？此操作不可恢复。')) return
    setActing(true)
    setActionError(null)
    // 乐观清空：失败撤销变更并 reload() 找回列表。
    setMutations((current) => ({ ...current, cleared: true }))
    try {
      await notifications.clear()
    } catch (cause) {
      setMutations((current) => ({ ...current, cleared: false }))
      setActionError(
        isMissingEndpoint(cause)
          ? '服务器版本暂不支持「清除」——稍后再试'
          : messageOf(cause, '清除失败'),
      )
      reload()
    } finally {
      setActing(false)
    }
  }

  const groups = [
    {
      title: 'PVP / 锦标赛',
      items: rows.filter((notification) => PVP_KINDS.has(notification.kind)),
    },
    {
      title: 'PVE / 系统',
      items: rows.filter((notification) => !PVP_KINDS.has(notification.kind)),
    },
  ].filter((group) => group.items.length > 0)

  return (
    <div className='space-y-6'>
      {
        /* F3：操作条 sticky（贴在 h-12 顶栏下沿），长列表滚到哪都看得见
        「全部已读 / 清除」；铺页面底色避免下方行卡透出。 */
      }
      <div
        className='sticky top-12 z-10 flex flex-wrap items-center justify-between gap-3 bg-(--background) py-2'
        {...tm('I.action-bar')}
      >
        <div className='flex items-center gap-3'>
          <h1
            className='text-2xl font-black tracking-tight text-(--foreground)'
            {...tm('I.page-title')}
          >
            通知
          </h1>
          {unread > 0
            ? (
              <Badge tone='accent' {...tm('I.unread-badge')}>
                {unread} 条未读
              </Badge>
            )
            : null}
        </div>
        {rows.length > 0
          ? (
            <div className='flex items-center gap-2' {...tm('I.actions')}>
              <Button
                size='sm'
                variant='secondary'
                disabled={acting || unread === 0}
                onClick={() => void readAll()}
                {...tm('I.read-all-button')}
              >
                <CheckCheck className='mr-1.5 h-4 w-4' />
                全部已读
              </Button>
              <Button
                size='sm'
                variant='secondary'
                disabled={acting}
                onClick={() => void clearAll()}
                {...tm('I.clear-button')}
              >
                <Trash2 className='mr-1.5 h-4 w-4' />
                清除
              </Button>
            </div>
          )
          : null}
      </div>

      {actionError
        ? (
          <p className='text-sm text-(--accent)' {...tm('I.action-error')}>
            {actionError}
          </p>
        )
        : null}

      {
        /* F3：仅首载显示加载/错误整页文案；一旦拿到过数据，重取期间列表
        保持挂载——文档高度不塌，scrollY 不会被浏览器钳回顶部。 */
      }
      {loading && data == null
        ? (
          <p
            className='text-sm text-(--foreground-subtle)'
            {...tm('I.loading')}
          >
            加载中…
          </p>
        )
        : error && data == null
        ? <p className='text-sm text-(--accent)' {...tm('I.error')}>{error}</p>
        : groups.length > 0
        ? (
          <div className='space-y-4' {...tm('I.group-list')}>
            {groups.map((group) => (
              <div key={group.title} className='space-y-2' {...tm('I.group')}>
                <p
                  className='text-[11px] font-semibold tracking-[0.14em] text-(--foreground-muted) uppercase'
                  {...tm('I.group-title')}
                >
                  {group.title}
                </p>
                {group.items.map((notification) => (
                  <NotificationRow
                    key={notification.id}
                    notification={notification}
                    onFollow={() => follow(notification)}
                    onMarkRead={() =>
                      void markRead(notification.id)}
                  />
                ))}
              </div>
            ))}
          </div>
        )
        : (
          <p className='text-sm text-(--foreground-subtle)' {...tm('I.empty')}>
            暂无通知。
          </p>
        )}
    </div>
  )
}

function NotificationRow({
  notification,
  onFollow,
  onMarkRead,
}: {
  notification: NotificationDTO
  onFollow: () => void
  onMarkRead: () => void
}) {
  const link = linkOf(notification)
  return (
    <Card {...tm('I.notification-row')}>
      <CardContent className='flex items-start justify-between gap-3 py-4'>
        <div className='flex min-w-0 flex-1 items-start gap-3'>
          <span
            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
              notification.read ? 'bg-(--border)' : 'bg-(--accent)'
            }`}
            {...tm('I.unread-dot')}
          />
          <div className='min-w-0'>
            <div className='flex flex-wrap items-center gap-2'>
              <Badge
                tone={PVP_KINDS.has(notification.kind) ? 'accent' : 'info'}
                {...tm('I.kind-badge')}
              >
                {kindLabel(notification.kind)}
              </Badge>
              {
                /* G25：title/body 服务端渲染，客户端只展示；老服务器缺席
                → 只有 kind 徽章与回落链接。 */
              }
              {notification.title
                ? (
                  <span
                    className='text-sm font-medium text-(--foreground)'
                    {...tm('I.notification-title')}
                  >
                    {notification.title}
                  </span>
                )
                : null}
            </div>
            {notification.body
              ? (
                <p
                  className='mt-1 text-sm leading-relaxed text-(--foreground-subtle)'
                  {...tm('I.notification-body')}
                >
                  {notification.body}
                </p>
              )
              : null}
            {link
              ? (
                <Link
                  to={link}
                  onClick={onFollow}
                  className='mt-1 inline-block text-xs text-(--accent)'
                  {...tm('I.detail-link')}
                >
                  {notification.link
                    ? '查看详情 →'
                    : `查看对战 #${notification.matchID}`}
                </Link>
              )
              : null}
          </div>
        </div>
        {!notification.read
          ? (
            <Button
              size='sm'
              variant='secondary'
              onClick={onMarkRead}
              {...tm('I.mark-read-button')}
            >
              标为已读
            </Button>
          )
          : null}
      </CardContent>
    </Card>
  )
}
