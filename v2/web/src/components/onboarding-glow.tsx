import type { ReactNode } from 'react'
import './onboarding-glow.css'

export function OnboardingGlow({
  active = false,
  delayed = false,
  children,
}: {
  active?: boolean
  delayed?: boolean
  children: ReactNode
}) {
  return (
    <span
      aria-hidden='true'
      className='onboarding-glow'
      data-glow={active ? 'ripple' : undefined}
      data-delayed={delayed || undefined}
    >
      {active && (
        <span className='onboarding-glow-waves'>
          <span className='onboarding-glow-wave' />
        </span>
      )}
      <span className='onboarding-glow-icon'>{children}</span>
    </span>
  )
}
