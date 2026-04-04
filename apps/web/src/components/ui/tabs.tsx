import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
} from 'react'

import { cn } from '../../lib/cn'

type TabsContextValue = {
  baseId: string
  setValue: (value: string) => void
  value: string | undefined
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabsContext(componentName: string) {
  const context = useContext(TabsContext)

  if (!context) {
    throw new Error(`${componentName} must be used within Tabs`)
  }

  return context
}

type TabsProps = HTMLAttributes<HTMLDivElement> & {
  defaultValue?: string
  onValueChange?: (value: string) => void
  value?: string
}

export function Tabs({
  children,
  className,
  defaultValue,
  onValueChange,
  value: controlledValue,
  ...props
}: TabsProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue)
  const baseId = useId()
  const value = controlledValue ?? uncontrolledValue
  const setValue = useCallback(
    (nextValue: string) => {
      if (controlledValue == null) {
        setUncontrolledValue(nextValue)
      }

      onValueChange?.(nextValue)
    },
    [controlledValue, onValueChange],
  )
  const contextValue = useMemo(
    () => ({ baseId, setValue, value }),
    [baseId, setValue, value],
  )

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={cn('space-y-6', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

export function TabsList({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 overflow-x-auto border-b border-(--border-soft)',
        className,
      )}
      role="tablist"
      {...props}
    />
  )
}

type TabsTriggerProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  value: string
}

export function TabsTrigger({
  className,
  onClick,
  value,
  ...props
}: TabsTriggerProps) {
  const context = useTabsContext('TabsTrigger')
  const isActive = context.value === value
  const triggerId = `${context.baseId}-${value}-trigger`
  const contentId = `${context.baseId}-${value}-content`

  return (
    <button
      aria-controls={contentId}
      aria-selected={isActive}
      className={cn(
        'relative -mb-px inline-flex h-11 items-center justify-center whitespace-nowrap border-b-2 border-transparent px-4 text-sm font-semibold text-(--foreground-subtle) transition-colors duration-150 hover:text-(--foreground) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(224,74,47,0.35)] disabled:pointer-events-none disabled:opacity-50',
        isActive && 'border-(--accent) text-(--foreground)',
        className,
      )}
      data-state={isActive ? 'active' : 'inactive'}
      id={triggerId}
      onClick={(event) => {
        onClick?.(event)

        if (!event.defaultPrevented) {
          context.setValue(value)
        }
      }}
      role="tab"
      tabIndex={isActive ? 0 : -1}
      type="button"
      {...props}
    />
  )
}

type TabsContentProps = HTMLAttributes<HTMLDivElement> & {
  value: string
}

export function TabsContent({
  children,
  className,
  value,
  ...props
}: TabsContentProps) {
  const context = useTabsContext('TabsContent')
  const isActive = context.value === value
  const triggerId = `${context.baseId}-${value}-trigger`
  const contentId = `${context.baseId}-${value}-content`

  return (
    <div
      aria-labelledby={triggerId}
      className={cn(!isActive && 'hidden', className)}
      data-state={isActive ? 'active' : 'inactive'}
      hidden={!isActive}
      id={contentId}
      role="tabpanel"
      {...props}
    >
      {children}
    </div>
  )
}
