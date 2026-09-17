// Shared with action menus so every dropdown follows the approved agent demo.
export const dropdownPopupClassName =
  'max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-(--border) bg-(--surface-elevated) p-1.5 text-(--foreground) shadow-[0_12px_36px_rgba(0,0,0,0.32)] outline-none'

// Subtract the popup's 12px padding and 2px border from the available height.
export const dropdownScrollClassName =
  'max-h-[min(18rem,calc(var(--available-height,18rem)-0.875rem))] space-y-0.5 overflow-y-auto overscroll-contain'

export const dropdownItemClassName =
  'flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 text-left text-sm text-(--foreground-subtle) outline-none transition-colors data-[highlighted]:bg-white/8 data-[highlighted]:text-(--foreground) data-[selected]:bg-white/4 data-[selected]:text-(--foreground) data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 motion-reduce:transition-none md:min-h-9'
