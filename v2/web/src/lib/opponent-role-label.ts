import type { RoleIdentityDTO, Side } from '../api/types'
import { roleIdentity } from './role-identity'
import { roleByKey, scenarioModule } from '../scenarios'

// A player row may represent several agents. List their distinct roles instead
// of pretending the first agent is the one the server will select for a match.
export function opponentRoleLabel(
  scenarioID: string,
  side: Side,
  roles: readonly (RoleIdentityDTO | null | undefined)[],
  fallback: string,
): string {
  return [
    ...new Set(roles.map((role) => {
      const identity = roleIdentity({
        scenarioID,
        side,
        role,
        fallback,
      })
      return roleByKey(scenarioModule(scenarioID), identity.roleKey)?.name ??
        identity.name
    })),
  ].join(' / ') || roleIdentity({ scenarioID, side, fallback }).name
}
