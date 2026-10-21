import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { RolePortrait } from '../../components/role-portrait'
import { speakerLabels } from '../../components/timeline/labels'
import { roleByKey, scenarioModule } from '../../scenarios'

export function EntryPicker(
  { scenarioID, side, faction, current, onCommit, onClose }: {
    scenarioID: string
    side: 'a' | 'b'
    faction: string
    current: string | null
    onCommit: (roleKey: string) => boolean
    onClose: () => void
  },
) {
  const module = scenarioModule(scenarioID)
  const roles = module?.roles.filter((role) => role.side === side) ?? []
  const [roleKey, setRoleKey] = useState(() =>
    roleByKey(module, current)?.key ?? null
  )
  const title = useRef<HTMLHeadingElement>(null)
  const labels = speakerLabels(scenarioID, {})

  useEffect(() => {
    title.current?.focus({ preventScroll: true })
    title.current?.scrollIntoView({ block: 'nearest' })
  }, [])

  return (
    <div
      className='sortie-entry-picker'
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation()
          onClose()
        }
      }}
    >
      <div className='sortie-picker-title'>
        <div>
          <p>{faction}</p>
          <h4 tabIndex={-1} ref={title}>选择出战角色</h4>
        </div>
        <button type='button' aria-label='取消出战设置' onClick={onClose}>
          <X size={18} />
        </button>
      </div>
      <div
        className='sortie-picker-roles'
        role='group'
        aria-label='本阵营可选角色'
      >
        {roles.map((role) => (
          <button
            key={role.key}
            type='button'
            aria-pressed={roleKey === role.key}
            onClick={() => setRoleKey(role.key)}
          >
            <RolePortrait labels={labels} speaker={role.key} size='sm' />
            <strong>{role.name}</strong>
            <span>{role.pitch}</span>
          </button>
        ))}
      </div>
      <div className='sortie-picker-footer'>
        <button
          className='sortie-primary'
          type='button'
          disabled={!roleKey}
          onClick={() => {
            if (roleKey) onCommit(roleKey)
          }}
        >
          确认角色
        </button>
      </div>
    </div>
  )
}
