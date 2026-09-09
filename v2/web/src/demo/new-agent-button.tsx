import { Bot, Plus } from 'lucide-react'
import { Button } from '../components/ui/button'

export function NewAgentButton({ role, onClick }: {
  role: string
  onClick: (anchor: HTMLElement) => void
}) {
  return (
    <Button
      type='button'
      size='sm'
      variant='ghost'
      className='h-8 w-8 shrink-0 rounded-full p-0'
      aria-label={`新建${role}智能体`}
      title={`新建${role}智能体`}
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
