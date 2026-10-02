import type { RoleIdentityDTO, Side } from '../api/types'
import { currentRoleIdentity, type RoleIdentityContext } from './role-identity'

// The battle panel names a participant by role. When the role is unknown it
// keeps the faction name, so the row still says which side it is on.
export function roleOrFactionName(
  context: RoleIdentityContext & { fallback: string },
): string {
  const identity = currentRoleIdentity(context)
  return identity.resolved ? identity.name : `${context.fallback}（角色待确认）`
}

// A player row may represent several agents. List their distinct roles instead
// of pretending the first agent is the one the server will select for a match.
export function opponentRoleLabel(
  scenarioID: string,
  side: Side,
  roles: readonly (RoleIdentityDTO | null | undefined)[],
  fallback: string,
): string {
  return [
    ...new Set(
      roles.map((role) =>
        roleOrFactionName({ scenarioID, side, role, fallback })
      ),
    ),
  ].join(' / ') || fallback
}
