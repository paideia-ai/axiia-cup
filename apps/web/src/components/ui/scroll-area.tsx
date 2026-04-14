import { ScrollArea as BaseScrollArea } from '@base-ui-components/react/scroll-area'
import type { ReactNode } from 'react'

import { cn } from '../../lib/cn'

interface ScrollAreaProps {
  children: ReactNode
  className?: string
}

export function ScrollArea({ children, className }: ScrollAreaProps) {
  return (
    <BaseScrollArea.Root
      className={cn('relative overflow-hidden h-full', className)}
    >
      <BaseScrollArea.Viewport className="h-full w-full">
        <BaseScrollArea.Content>{children}</BaseScrollArea.Content>
      </BaseScrollArea.Viewport>
      <BaseScrollArea.Scrollbar
        orientation="vertical"
        className="absolute right-0 top-0 bottom-0 flex w-2.5 touch-none select-none p-0.5 opacity-0 transition-opacity duration-300 data-[hovering]:opacity-100 data-[scrolling]:opacity-100"
      >
        <BaseScrollArea.Thumb className="flex-1 rounded-full bg-white/20 transition-colors duration-150 hover:bg-white/35" />
      </BaseScrollArea.Scrollbar>
    </BaseScrollArea.Root>
  )
}
