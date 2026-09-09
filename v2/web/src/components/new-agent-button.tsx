import { Bot, Plus } from 'lucide-react'

import { Button } from './ui/button'

interface NewAgentButtonProps {
  role: string
  disabled?: boolean
  label?: string
  onClick: (anchor: HTMLElement) => void
}

export function NewAgentButton({
  role,
  disabled = false,
  label,
  onClick,
}: NewAgentButtonProps) {
  const accessibleLabel = label ?? `新建${role}智能体`

  return (
    <Button
      type='button'
      size='sm'
      variant='ghost'
      disabled={disabled}
      className='h-11 w-11 shrink-0 rounded-full p-0 md:h-8 md:w-8'
      aria-label={accessibleLabel}
      title={accessibleLabel}
      onClick={(event) => onClick(event.currentTarget)}
    >
      <span aria-hidden='true' className='relative h-5 w-5'>
        <Bot className='h-5 w-5' />
        <Plus
          className='absolute -right-1 -bottom-0.5 h-3 w-3 rounded-sm bg-(--background)'
          strokeWidth={2.5}
        />
      </span>
    </Button>
  )
}
