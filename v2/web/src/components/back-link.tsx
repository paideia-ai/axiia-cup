import { Link, type LinkProps, useNavigate } from 'react-router-dom'

import { useNavigationMemory } from '../context/navigation-memory'
import { returnDestination } from '../lib/navigation-memory'

// Keep a real href for keyboard navigation and opening in another tab. Only a
// normal same-tab click traverses a history entry that this app actually observed.
export function BackLink({
  to,
  label,
  ...props
}: Omit<LinkProps, 'to' | 'children'> & { to: string; label: string }) {
  const context = useNavigationMemory()
  const navigate = useNavigate()
  const destination = returnDestination(
    context?.memory ?? { visits: [], index: -1 },
    to,
    label,
  )
  return (
    <Link
      {...props}
      to={destination.to}
      onClick={(event) => {
        props.onClick?.(event)
        if (
          event.defaultPrevented || event.button !== 0 || event.metaKey ||
          event.ctrlKey || event.shiftKey || event.altKey ||
          (props.target && props.target !== '_self') ||
          destination.delta == null
        ) return
        event.preventDefault()
        void navigate(destination.delta)
      }}
    >
      ← {destination.label}
    </Link>
  )
}
