import { useId, useMemo, useState } from 'react'
import { ArrowLeftRight, ChevronDown } from 'lucide-react'
import { versionTag } from '../lib/version-label'
import { comparisonModel, VersionPicker } from './version-picker'
import type { DemoVersion } from './model'
import { promptDiff } from './prompt-diff'

// Local comparison only: no production API requests or changes to saved versions.
export function VersionCompare({ versions }: { versions: DemoVersion[] }) {
  const sorted = [...versions].sort((a, b) => b.id - a.id)
  const [baseID, setBaseID] = useState(String(sorted[1]?.id ?? ''))
  const [headID, setHeadID] = useState(String(sorted[0]?.id ?? ''))
  const [open, setOpen] = useState(false)
  const panelID = useId()
  const base = sorted.find((version) => String(version.id) === baseID)
  const head = sorted.find((version) => String(version.id) === headID)
  const before = base?.prompt ?? ''
  const after = head?.prompt ?? ''
  const changes = useMemo(() => open ? promptDiff(before, after) : [], [
    before,
    after,
    open,
  ])
  if (!sorted.length) return null
  return (
    <section
      aria-label='版本对比'
      className='space-y-3 border-t border-(--border-soft) pt-4'
    >
      {sorted.length === 1
        ? (
          <p className='text-xs text-(--foreground-muted)'>
            再保存一个版本即可对比两版策略。
          </p>
        )
        : (
          <>
            <div className='flex items-center gap-2 sm:gap-3'>
              <h2 className='shrink-0'>
                <button
                  type='button'
                  aria-expanded={open}
                  aria-controls={panelID}
                  onClick={() => setOpen(!open)}
                  className='flex cursor-pointer items-center gap-1.5 rounded-sm py-2 text-sm font-medium text-(--foreground-subtle) hover:text-(--foreground) focus-visible:outline-2 focus-visible:outline-(--accent)'
                >
                  <ChevronDown
                    aria-hidden='true'
                    className={`h-3.5 w-3.5 transition-transform ${
                      open ? '' : '-rotate-90'
                    }`}
                  />
                  版本对比
                </button>
              </h2>
              {([
                ['基准版本', baseID, headID, setBaseID],
                ['对比版本', headID, baseID, setHeadID],
              ] as const).map(([label, value, otherID, setValue], index) => (
                <div
                  key={label}
                  className='flex min-w-0 items-center gap-2 sm:gap-3'
                >
                  {index === 1 && (
                    <ArrowLeftRight
                      aria-hidden='true'
                      className='h-3.5 w-3.5 shrink-0 text-(--foreground-muted)'
                    />
                  )}
                  <VersionPicker
                    label={label}
                    value={value}
                    otherID={otherID}
                    versions={sorted}
                    onChange={(next) => {
                      if (next !== otherID) {
                        setValue(next)
                        setOpen(true)
                      }
                    }}
                  />
                </div>
              ))}
            </div>
            <div id={panelID} hidden={!open}>
              {open && base && head && (
                <div className='space-y-3' data-testid='version-comparison'>
                  {before === after
                    ? (
                      <p
                        role='status'
                        className='text-xs text-(--foreground-muted)'
                      >
                        两版策略正文相同。
                      </p>
                    )
                    : (
                      <p className='flex gap-4 text-xs text-(--foreground-subtle)'>
                        <span className='text-red-300'>− 删去</span>
                        <span className='text-emerald-300'>＋ 新增</span>
                      </p>
                    )}
                  <div className='grid gap-3 md:grid-cols-2'>
                    {[base, head].map((version, index) => (
                      <div key={version.id} className='min-w-0 space-y-2'>
                        <p className='text-xs text-(--foreground-subtle)'>
                          <span className='font-semibold'>
                            {versionTag(version, sorted)}
                          </span>
                          {version.note?.trim() && (
                            <span className='ml-2 break-words'>
                              {version.note.trim()}
                            </span>
                          )}
                          {comparisonModel(version) && (
                            <span className='ml-2 text-(--foreground-muted)'>
                              {comparisonModel(version)}
                            </span>
                          )}
                        </p>
                        <pre
                          aria-label={`${versionTag(version, sorted)} 策略正文`}
                          className='max-h-96 overflow-auto whitespace-pre-wrap wrap-anywhere rounded-md border border-(--border-soft) bg-white/2 p-4 font-sans text-sm leading-7 text-(--foreground-subtle)'
                        >
                      {changes.filter((change) => change.kind !== (index === 0 ? 'added' : 'removed')).map((change, part) =>
                        change.kind === 'same' ? change.text : change.kind === 'removed'
                          ? <del key={part} className='rounded-sm bg-red-400/15 text-red-200 decoration-red-300/60'>{change.text}</del>
                          : <ins key={part} className='rounded-sm bg-emerald-400/15 text-emerald-200 underline decoration-emerald-300/60 underline-offset-4'>{change.text}</ins>
                      )}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
    </section>
  )
}
