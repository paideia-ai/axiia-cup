import { cva, type VariantProps } from 'class-variance-authority'
import { type ButtonHTMLAttributes, useRef } from 'react'

import { cn } from '../../lib/cn'
import { useSound } from '../../context/sound'

const buttonVariants = cva(
  // The focus ring needs an offset: a half-opacity accent ring drawn flush against
  // an accent-filled button is invisible, which is what shipped before.
  'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background) disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-(--accent) text-white hover:bg-(--accent-hover)',
        secondary:
          'border border-(--border) bg-transparent text-(--foreground) hover:border-(--foreground-muted) hover:bg-white/3',
        ghost: 'bg-transparent text-(--foreground) hover:bg-white/4',
      },
      size: {
        default: 'h-10',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-5 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
)

type ButtonProps =
  & ButtonHTMLAttributes<HTMLButtonElement>
  & VariantProps<typeof buttonVariants>
  & { soundFeedback?: boolean }

export function Button(
  {
    className,
    size,
    variant,
    soundFeedback = false,
    onPointerMove,
    onPointerLeave,
    onClick,
    ...props
  }: ButtonProps,
) {
  const sound = useSound()
  const hovered = useRef(false)
  return (
    <button
      className={cn(buttonVariants({ className, size, variant }))}
      {...props}
      onPointerMove={(event) => {
        onPointerMove?.(event)
        if (
          soundFeedback && !event.currentTarget.disabled &&
          event.pointerType === 'mouse' && !hovered.current &&
          (event.movementX !== 0 || event.movementY !== 0)
        ) {
          // Require actual mouse movement: re-enabling a button under a still
          // pointer can synthesize pointerenter after a save completes.
          hovered.current = true
          // Hover never tries to unlock browser audio or queues a delayed cue.
          sound.play('hover', crypto.randomUUID())
        }
      }}
      onPointerLeave={(event) => {
        hovered.current = false
        onPointerLeave?.(event)
      }}
      onClick={(event) => {
        if (soundFeedback && !event.currentTarget.disabled) {
          // Resume within this gesture, but let action handlers cancel old audio
          // first (the demo resets its previous run synchronously).
          void sound.unlock().then((ready) => {
            if (ready) sound.play('click', crypto.randomUUID())
          })
        }
        onClick?.(event)
      }}
    />
  )
}
