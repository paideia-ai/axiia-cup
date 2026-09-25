import type { JSONValue, RoleIdentityDTO, Side } from '../api/types'
import { roleByKey, roleOfOptions, scenarioModule } from '../scenarios'

export interface RoleIdentityContext {
  scenarioID?: string | null
  side: Side
  role?: RoleIdentityDTO | null
  roleKey?: string | null
  options?: JSONValue | string | null
  // Only speakers that actually occur in this match, never all declared lanes.
  speakers?: readonly string[]
  lanes?: Record<string, string> | null
  fallback?: string | null
}

export function hasSelectableRoles(scenarioID?: string | null): boolean {
  return (scenarioModule(scenarioID)?.roles.length ?? 0) > 0
}

// Factions describe the scenario; roles identify a particular participant.
// Keep that distinction here so reports, scores, profiles and builders agree.
export function roleIdentity(context: RoleIdentityContext): {
  name: string
  roleKey: string | null
  resolved: boolean
} {
  const identity = context.role
  if (identity?.side === context.side && identity.key && identity.name.trim()) {
    return { name: identity.name, roleKey: identity.key, resolved: true }
  }
  const module = scenarioModule(context.scenarioID)
  const roles = module?.roles.filter((role) => role.side === context.side) ?? []
  const selected = roleByKey(module, context.roleKey) ??
    roleOfOptions(module, context.options)
  if (selected?.side === context.side) {
    return { name: selected.name, roleKey: selected.key, resolved: true }
  }
  const observed = new Set(
    (context.speakers ?? []).flatMap((key) => {
      const role = roleByKey(module, key)
      return role?.side === context.side ? [role.key] : []
    }),
  )
  if (observed.size === 1) {
    const role = roleByKey(module, [...observed][0])!
    return { name: role.name, roleKey: role.key, resolved: true }
  }
  if (roles.length > 0) {
    // A concrete per-match label is useful before the first spoken turn. A
    // faction label or a registry listing every possible role is not evidence.
    const labels = [context.lanes?.[context.side], context.fallback]
    const named = observed.size === 0
      ? roles.find((role) =>
        labels.some((label) =>
          role.name === label || role.key === label ||
          role.aliases?.includes(label ?? '')
        )
      )
      : null
    if (named) {
      return { name: named.name, roleKey: named.key, resolved: true }
    }
    return {
      name: `${context.side === 'a' ? '甲方' : '乙方'}（角色待确认）`,
      roleKey: null,
      resolved: false,
    }
  }
  return {
    name: context.lanes?.[context.side] ?? context.fallback ??
      module?.laneLabels[context.side] ??
      (context.side === 'a' ? '甲方' : '乙方'),
    roleKey: null,
    resolved: true,
  }
}
