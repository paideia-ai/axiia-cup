import { Select } from '@base-ui-components/react/select'
import { Check, ChevronDown } from 'lucide-react'

export function ModelSelect({ value, options, onChange }: {
  value: string
  options: { id: string; label: string }[]
  onChange: (value: string) => void
}) {
  const selected = options.find((option) => option.id === value)
  return (
    <Select.Root
      value={value}
      items={options.map((option) => ({
        value: option.id,
        label: option.label,
      }))}
      onValueChange={(next) => {
        if (next) onChange(next)
      }}
    >
      <Select.Trigger
        aria-label='模型'
        className='group flex h-10 w-full items-center justify-between gap-3 rounded-lg border border-(--border) bg-white/2 px-3 text-sm text-(--foreground) transition-colors hover:border-(--foreground-muted) hover:bg-white/4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) data-popup-open:border-(--foreground-muted)'
      >
        <Select.Value className='min-w-0 truncate text-left'>
          {selected?.label ?? value}
        </Select.Value>
        <Select.Icon>
          <ChevronDown
            aria-hidden='true'
            className='h-3.5 w-3.5 shrink-0 text-(--foreground-muted) transition-transform duration-150 group-data-popup-open:rotate-180 motion-reduce:transition-none'
          />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner
          side='bottom'
          align='start'
          sideOffset={6}
          collisionPadding={16}
          alignItemWithTrigger={false}
          className='z-[60]'
        >
          <Select.Popup className='demo-overlay-panel w-[var(--anchor-width)] max-w-[calc(100vw-2rem)] overflow-hidden p-1.5 outline-none'>
            <Select.List className='max-h-[min(18rem,calc(var(--available-height,18rem)-12px))] space-y-0.5 overflow-y-auto overscroll-contain'>
              {options.map((option) => (
                <Select.Item
                  key={option.id}
                  value={option.id}
                  className='flex min-h-11 items-center gap-3 rounded-md px-2.5 py-2 text-sm text-(--foreground-subtle) outline-none transition-colors data-highlighted:bg-white/8 data-highlighted:text-(--foreground) data-selected:bg-white/4 data-selected:text-(--foreground) md:min-h-9'
                >
                  <Select.ItemText className='min-w-0 flex-1 text-left'>
                    {option.label}
                  </Select.ItemText>
                  <span className='flex h-4 w-4 shrink-0 items-center justify-center'>
                    <Select.ItemIndicator>
                      <Check
                        aria-hidden='true'
                        className='h-3.5 w-3.5 text-(--accent)'
                        strokeWidth={2}
                      />
                    </Select.ItemIndicator>
                  </span>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  )
}
