import { Select } from '@base-ui-components/react/select'
import { Check, ChevronDown } from 'lucide-react'
import type { DemoVersion } from './model'
import { versionTag } from '../lib/version-label'
import { demoModels } from './builder-settings'

export function comparisonModel(version: DemoVersion) {
  return version.detailsMissing
    ? ''
    : demoModels.find((model) => model.id === version.modelID)?.label ??
      version.modelID
}

export function VersionPicker({ label, value, otherID, versions, onChange }: {
  label: string
  value: string
  otherID: string
  versions: DemoVersion[]
  onChange: (value: string) => void
}) {
  const selected = versions.find((version) => String(version.id) === value)
  return (
    <Select.Root
      value={value}
      onValueChange={(next) => {
        if (next) onChange(next)
      }}
    >
      <Select.Trigger
        aria-label={label}
        className='flex h-8 w-20 cursor-pointer items-center justify-between gap-2 rounded-md border border-(--border-soft) bg-white/2 px-2 text-xs text-(--foreground-subtle) hover:border-(--foreground-muted) focus-visible:outline-2 focus-visible:outline-(--accent) sm:w-24'
      >
        <Select.Value>
          {selected ? versionTag(selected, versions) : ''}
        </Select.Value>
        <ChevronDown aria-hidden='true' className='h-3.5 w-3.5' />
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner
          side='bottom'
          sideOffset={6}
          align='start'
          collisionPadding={16}
          className='z-[60]'
        >
          <Select.Popup className='w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-(--border) bg-(--surface-elevated) py-1 shadow-xl'>
            <Select.List className='max-h-72 overflow-y-auto'>
              {versions.filter((version) => String(version.id) !== otherID).map(
                (version) => (
                  <Select.Item
                    key={version.id}
                    value={String(version.id)}
                    className='flex cursor-pointer items-center gap-2 px-3 py-2 text-(--foreground-subtle) outline-none data-[highlighted]:bg-white/5'
                  >
                    <span className='flex w-4 shrink-0 justify-center'>
                      <Select.ItemIndicator>
                        <Check
                          aria-hidden='true'
                          className='h-3.5 w-3.5 text-(--accent)'
                        />
                      </Select.ItemIndicator>
                    </span>
                    <Select.ItemText className='min-w-0 flex-1'>
                      <span
                        className='block truncate text-xs'
                        title={version.note ?? undefined}
                      >
                        {versionTag(version, versions)}
                        {version.note?.trim()
                          ? ` · ${version.note.trim()}`
                          : ''}
                      </span>
                      {comparisonModel(version) && (
                        <span className='mt-0.5 block truncate text-[10px] text-(--foreground-muted)'>
                          {comparisonModel(version)}
                        </span>
                      )}
                    </Select.ItemText>
                  </Select.Item>
                ),
              )}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  )
}
