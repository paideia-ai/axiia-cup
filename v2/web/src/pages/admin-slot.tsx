import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { admin } from '../api/client'
import type { SlotDTO, UpdateSlotRequest } from '../api/types'
import { ScriptView } from '../components/script-view'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Select, SelectItem } from '../components/ui/select'
import { Textarea } from '../components/ui/textarea'
import { useAuth } from '../context/auth'
import { messageOf, useAsync } from '../lib/use-async'
import { tm } from '../testmode/mark'

const STATUSES = ['live', 'draft', 'retired']

function ScriptCard({
  sha,
  onRepoint,
}: {
  sha: string
  onRepoint: (sha: string) => Promise<void>
}) {
  const { data, error, loading } = useAsync(() => admin.script(sha), [sha])
  const [uploading, setUploading] = useState(false)
  const [draft, setDraft] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [failure, setFailure] = useState<string | null>(null)

  const upload = async (source: string) => {
    setUploading(true)
    setNotice(null)
    setFailure(null)
    try {
      const { sha: created } = await admin.createScript({ source })
      await onRepoint(created)
      setNotice(`已上传并指向 ${created.slice(0, 12)}`)
      setDraft(null)
    } catch (cause) {
      setFailure(messageOf(cause, '上传失败'))
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card {...tm('ADM.script-card')}>
      <CardContent className='space-y-3 pt-5'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <h2 className='text-sm font-semibold text-(--foreground)'>脚本</h2>
          <code
            {...tm('ADM.script-sha')}
            className='text-xs text-(--foreground-muted)'
          >
            {sha}
          </code>
        </div>
        {loading && !data
          ? (
            <p
              {...tm('ADM.script-loading')}
              className='text-sm text-(--foreground-subtle)'
            >
              加载中…
            </p>
          )
          : error
          ? (
            <p {...tm('ADM.script-error')} className='text-sm text-(--accent)'>
              {error}
            </p>
          )
          : data
          ? <ScriptView source={data.source} />
          : null}

        {draft == null
          ? (
            <Button
              {...tm('ADM.script-edit-button')}
              variant='secondary'
              size='sm'
              onClick={() => setDraft(data?.source ?? '')}
              disabled={!data}
            >
              编辑并上传新版本
            </Button>
          )
          : (
            <div className='space-y-2'>
              <Textarea
                {...tm('ADM.script-draft-input')}
                className='h-96 font-mono text-xs'
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                spellCheck={false}
              />
              <div className='flex gap-2'>
                <Button
                  {...tm('ADM.script-upload-button')}
                  size='sm'
                  disabled={uploading || !draft.trim()}
                  onClick={() => void upload(draft)}
                >
                  {uploading ? '上传中…' : '上传并指向本槽位'}
                </Button>
                <Button
                  {...tm('ADM.script-cancel-button')}
                  size='sm'
                  variant='secondary'
                  onClick={() => setDraft(null)}
                >
                  取消
                </Button>
              </div>
            </div>
          )}
        {notice
          ? (
            <p
              {...tm('ADM.script-notice')}
              className='text-sm text-(--success)'
            >
              {notice}
            </p>
          )
          : null}
        {failure
          ? (
            <p
              {...tm('ADM.script-error-notice')}
              className='text-sm text-(--accent)'
            >
              {failure}
            </p>
          )
          : null}
      </CardContent>
    </Card>
  )
}

function SlotEditor({ slot, onSaved }: { slot: SlotDTO; onSaved: () => void }) {
  const [title, setTitle] = useState(slot.title)
  const [status, setStatus] = useState(slot.status)
  const [scriptSHA, setScriptSHA] = useState(slot.scriptSHA)
  const [params, setParams] = useState(JSON.stringify(slot.params, null, 2))
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [failure, setFailure] = useState<string | null>(null)

  useEffect(() => {
    setTitle(slot.title)
    setStatus(slot.status)
    setScriptSHA(slot.scriptSHA)
    setParams(JSON.stringify(slot.params, null, 2))
  }, [slot])

  // The server takes params opaquely apart from `presets`, so malformed JSON must
  // never leave the browser: it would land as a 400 with no line to point at.
  let paramsError: string | null = null
  try {
    const parsed = JSON.parse(params)
    if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      paramsError = 'params 必须是 JSON 对象'
    }
  } catch (cause) {
    paramsError = messageOf(cause, 'JSON 无法解析')
  }

  const save = async () => {
    if (paramsError) return
    setSaving(true)
    setNotice(null)
    setFailure(null)
    const body: UpdateSlotRequest = {
      title,
      status,
      scriptSHA,
      params: JSON.parse(params),
    }
    try {
      await admin.updateSlot(slot.id, body)
      setNotice('已保存')
      onSaved()
    } catch (cause) {
      setFailure(messageOf(cause, '保存失败'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card {...tm('ADM.slot-editor')}>
      <CardContent className='space-y-4 pt-5'>
        <h2 className='text-sm font-semibold text-(--foreground)'>槽位设置</h2>
        <div className='grid gap-3 sm:grid-cols-2'>
          <label className='space-y-1.5 text-sm text-(--foreground-subtle)'>
            <span className='block'>标题</span>
            <Input
              {...tm('ADM.slot-title-input')}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <label
            {...tm('ADM.slot-status-select')}
            className='space-y-1.5 text-sm text-(--foreground-subtle)'
          >
            <span className='block'>状态</span>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value ?? slot.status)}
            >
              {STATUSES.map((option) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </Select>
          </label>
        </div>
        <label className='space-y-1.5 text-sm text-(--foreground-subtle)'>
          <span className='block'>脚本 SHA</span>
          <Input
            {...tm('ADM.slot-script-sha-input')}
            className='font-mono text-xs'
            value={scriptSHA}
            onChange={(event) => setScriptSHA(event.target.value)}
          />
        </label>
        <label className='space-y-1.5 text-sm text-(--foreground-subtle)'>
          <span className='block'>
            params（JSON；<code>presets</code> 覆盖脚本自带的对手名单）
          </span>
          <Textarea
            {...tm('ADM.slot-params-input')}
            className='h-56 font-mono text-xs'
            value={params}
            onChange={(event) => setParams(event.target.value)}
            spellCheck={false}
          />
        </label>
        {paramsError
          ? (
            <p
              {...tm('ADM.slot-params-error')}
              className='text-sm text-(--accent)'
            >
              params：{paramsError}
            </p>
          )
          : null}
        <div className='flex items-center gap-3'>
          <Button
            {...tm('ADM.slot-save-button')}
            onClick={() => void save()}
            disabled={saving || paramsError != null}
          >
            {saving ? '保存中…' : '保存'}
          </Button>
          {notice
            ? (
              <span
                {...tm('ADM.slot-save-notice')}
                className='text-sm text-(--success)'
              >
                {notice}
              </span>
            )
            : null}
          {failure
            ? (
              <span
                {...tm('ADM.slot-save-error')}
                className='text-sm text-(--accent)'
              >
                {failure}
              </span>
            )
            : null}
        </div>
      </CardContent>
    </Card>
  )
}

export function AdminSlotPage() {
  const { elevated } = useAuth()
  const { slotId = '' } = useParams()
  const { data, error, loading, reload } = useAsync(
    () => admin.slots(),
    [slotId],
  )
  const slot = data?.slots.find((candidate) => candidate.id === slotId) ?? null

  const repoint = async (sha: string) => {
    await admin.updateSlot(slotId, { scriptSHA: sha })
    reload()
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-center gap-3'>
        <Link
          {...tm('ADM.slot-back-link')}
          to='/admin'
          className='text-sm text-(--accent)'
        >
          ← 管理面板
        </Link>
        <h1
          {...tm('ADM.slot-page-title')}
          className='text-2xl font-black tracking-tight text-(--foreground)'
        >
          {slot?.title ?? slotId}
        </h1>
      </div>

      {!elevated
        ? (
          <Card {...tm('ADM.elevation-notice')}>
            <CardContent className='pt-5 text-sm text-(--foreground-subtle)'>
              管理操作需要先提权。前往{' '}
              <Link
                {...tm('ADM.elevation-settings-link')}
                to='/settings'
                className='text-(--accent)'
              >
                账户设置
              </Link>{' '}
              输入 TOTP 验证码。
            </CardContent>
          </Card>
        )
        : loading && !data
        ? (
          <p
            {...tm('ADM.slot-loading')}
            className='text-sm text-(--foreground-subtle)'
          >
            加载中…
          </p>
        )
        : error
        ? (
          <p {...tm('ADM.slot-error')} className='text-sm text-(--accent)'>
            {error}
          </p>
        )
        : !slot
        ? (
          <p
            {...tm('ADM.slot-missing')}
            className='text-sm text-(--foreground-subtle)'
          >
            槽位不存在。
          </p>
        )
        : (
          <>
            <SlotEditor slot={slot} onSaved={reload} />
            <ScriptCard sha={slot.scriptSHA} onRepoint={repoint} />
          </>
        )}
    </div>
  )
}
