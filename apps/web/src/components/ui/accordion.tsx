import { Accordion as BaseAccordion } from '@base-ui-components/react/accordion'
import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '../../lib/cn'

interface AccordionProps {
  children: ReactNode
  className?: string
  defaultValue?: string[]
  value?: string[]
  onValueChange?: (value: string[]) => void
}

export function Accordion({
  children,
  className,
  defaultValue,
  value,
  onValueChange,
}: AccordionProps) {
  return (
    <BaseAccordion.Root
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange}
      className={cn('divide-y divide-(--border-soft)', className)}
    >
      {children}
    </BaseAccordion.Root>
  )
}

interface AccordionItemProps {
  children: ReactNode
  className?: string
  title: ReactNode
  triggerClassName?: string
  value: string
}

export function AccordionItem({
  children,
  className,
  title,
  triggerClassName,
  value,
}: AccordionItemProps) {
  return (
    <BaseAccordion.Item value={value} className={className}>
      <BaseAccordion.Header>
        <BaseAccordion.Trigger
          className={cn(
            'flex w-full cursor-pointer items-center justify-between py-3 text-left text-sm font-medium text-(--foreground-subtle) outline-none transition-colors duration-150 hover:text-(--foreground) data-[panel-open]:text-(--foreground) [&[data-panel-open]>svg]:rotate-180',
            triggerClassName,
          )}
        >
          {title}
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-(--foreground-muted) transition-transform duration-200" />
        </BaseAccordion.Trigger>
      </BaseAccordion.Header>
      <BaseAccordion.Panel className="pb-3">{children}</BaseAccordion.Panel>
    </BaseAccordion.Item>
  )
}
