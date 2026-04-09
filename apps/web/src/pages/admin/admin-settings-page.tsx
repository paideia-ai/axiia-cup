import { useEffect, useRef, useState, type ComponentProps } from 'react'

import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import {
  getAdminRegistrationCode,
  getAdminTokenSoftCap,
  updateAdminRegistrationCode,
  updateAdminTokenSoftCap,
} from '../../lib/api'

type SettingRowProps = {
  displayValue: string
  draftValue: string
  inputClassName?: string
  inputMode?: ComponentProps<typeof Input>['inputMode']
  isEditing: boolean
  isLoading: boolean
  isSaving: boolean
  label: string
  onCancel: () => void
  onChange: (value: string) => void
  onEdit: () => void
  onSave: () => Promise<void>
  placeholder: string
}

function SettingRow({
  displayValue,
  draftValue,
  inputClassName,
  inputMode,
  isEditing,
  isLoading,
  isSaving,
  label,
  onCancel,
  onChange,
  onEdit,
  onSave,
  placeholder,
}: SettingRowProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="w-full shrink-0 text-sm font-medium text-(--foreground) lg:w-40">
        {label}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          autoFocus={isEditing}
          className={inputClassName}
          disabled={!isEditing}
          inputMode={inputMode}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && draftValue.trim().length > 0) {
              void onSave()
            }
          }}
          placeholder={placeholder}
          readOnly={!isEditing}
          value={isEditing ? draftValue : isLoading ? '--' : displayValue}
        />
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {isEditing ? (
            <>
              <Button
                disabled={isSaving || draftValue.trim().length === 0}
                onClick={() => void onSave()}
                size="sm"
              >
                {isSaving ? '保存中...' : '保存'}
              </Button>
              <Button
                disabled={isSaving}
                onClick={onCancel}
                size="sm"
                variant="secondary"
              >
                取消
              </Button>
            </>
          ) : (
            <Button
              disabled={isLoading}
              onClick={onEdit}
              size="sm"
              variant="secondary"
            >
              修改
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export function AdminSettingsPage() {
  const [registrationCode, setRegistrationCode] = useState<string | null>(null)
  const [tokenSoftCap, setTokenSoftCap] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [registrationCodeDraft, setRegistrationCodeDraft] = useState('')
  const [isEditingRegistrationCode, setIsEditingRegistrationCode] =
    useState(false)
  const [isSavingRegistrationCode, setIsSavingRegistrationCode] =
    useState(false)
  const [tokenSoftCapDraft, setTokenSoftCapDraft] = useState('')
  const [isEditingTokenSoftCap, setIsEditingTokenSoftCap] = useState(false)
  const [isSavingTokenSoftCap, setIsSavingTokenSoftCap] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const latestLoadIdRef = useRef(0)

  useEffect(() => {
    if (!toast) {
      return
    }

    const timer = window.setTimeout(() => setToast(null), 3000)
    return () => window.clearTimeout(timer)
  }, [toast])

  async function loadSettings(isInitial: boolean) {
    const loadId = ++latestLoadIdRef.current

    if (isInitial) {
      setIsLoading(true)
    }

    try {
      setError(null)
      const [registrationCodeResponse, tokenSoftCapResponse] =
        await Promise.all([getAdminRegistrationCode(), getAdminTokenSoftCap()])

      if (loadId !== latestLoadIdRef.current) {
        return
      }

      setRegistrationCode(registrationCodeResponse.code)
      setTokenSoftCap(tokenSoftCapResponse.cap)

      if (!isEditingRegistrationCode) {
        setRegistrationCodeDraft(registrationCodeResponse.code)
      }
      if (!isEditingTokenSoftCap) {
        setTokenSoftCapDraft(String(tokenSoftCapResponse.cap))
      }
    } catch (loadError) {
      if (loadId !== latestLoadIdRef.current) {
        return
      }

      setError(loadError instanceof Error ? loadError.message : '加载设置失败')
    } finally {
      if (isInitial && loadId === latestLoadIdRef.current) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    void loadSettings(true)
  }, [])

  function handleCancelRegistrationCodeEdit() {
    setRegistrationCodeDraft(registrationCode ?? '')
    setIsEditingRegistrationCode(false)
  }

  async function handleSaveRegistrationCode() {
    try {
      setIsSavingRegistrationCode(true)
      setError(null)

      const result = await updateAdminRegistrationCode({
        code: registrationCodeDraft.trim(),
      })

      setRegistrationCode(result.code)
      setRegistrationCodeDraft(result.code)
      setIsEditingRegistrationCode(false)
      setToast('邀请码已更新')
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : '保存邀请码失败',
      )
    } finally {
      setIsSavingRegistrationCode(false)
    }
  }

  function handleCancelTokenSoftCapEdit() {
    setTokenSoftCapDraft(tokenSoftCap != null ? String(tokenSoftCap) : '')
    setIsEditingTokenSoftCap(false)
  }

  async function handleSaveTokenSoftCap() {
    const parsed = Number(tokenSoftCapDraft)
    if (!Number.isInteger(parsed) || parsed <= 0) {
      setError('Token 上限必须是正整数')
      return
    }

    try {
      setIsSavingTokenSoftCap(true)
      setError(null)

      const result = await updateAdminTokenSoftCap({ cap: parsed })

      setTokenSoftCap(result.cap)
      setTokenSoftCapDraft(String(result.cap))
      setIsEditingTokenSoftCap(false)
      setToast('Token 上限已更新')
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : '保存 Token 上限失败',
      )
    } finally {
      setIsSavingTokenSoftCap(false)
    }
  }

  return (
    <div className="space-y-4">
      {toast ? (
        <div className="fixed right-4 bottom-4 z-50 flex items-center gap-3 rounded-xl border border-(--border) bg-(--surface-elevated) px-4 py-3 text-sm text-(--foreground) shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
          <span className="h-2 w-2 shrink-0 rounded-full bg-(--success)" />
          {toast}
        </div>
      ) : null}

      {error ? <p className="text-sm text-(--accent)">{error}</p> : null}

      <SettingRow
        displayValue={registrationCode ?? '--'}
        draftValue={registrationCodeDraft}
        inputClassName="font-mono tracking-[0.2em]"
        isEditing={isEditingRegistrationCode}
        isLoading={isLoading}
        isSaving={isSavingRegistrationCode}
        label="邀请码"
        onCancel={handleCancelRegistrationCodeEdit}
        onChange={setRegistrationCodeDraft}
        onEdit={() => setIsEditingRegistrationCode(true)}
        onSave={handleSaveRegistrationCode}
        placeholder="输入新的邀请码"
      />

      <SettingRow
        displayValue={
          tokenSoftCap == null ? '--' : tokenSoftCap.toLocaleString()
        }
        draftValue={tokenSoftCapDraft}
        inputClassName="tabular-nums"
        inputMode="numeric"
        isEditing={isEditingTokenSoftCap}
        isLoading={isLoading}
        isSaving={isSavingTokenSoftCap}
        label="Token Soft Cap"
        onCancel={handleCancelTokenSoftCapEdit}
        onChange={setTokenSoftCapDraft}
        onEdit={() => setIsEditingTokenSoftCap(true)}
        onSave={handleSaveTokenSoftCap}
        placeholder="例如 500000"
      />
    </div>
  )
}
