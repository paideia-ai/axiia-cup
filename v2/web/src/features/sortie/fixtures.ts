import {
  portraitInventory,
  portraitScenarios,
} from '../../testing/agent-portrait-fixtures'
import { orderScenarios } from '../../lib/scenario-order'
import type { Entry } from './matchmaking'

// Entirely fictional agent-level ladder records. Shared with the local HTTP preview so the entry
// shown here and the one in My Agents refer to the same version ID.
import { colors } from './scenario-themes'

export const sortieScenarios = orderScenarios(
  portraitScenarios.map(({ summary }) => {
    const [shortTitle, accent, background, hook] = colors[summary.id]
    return { ...summary, shortTitle, accent, background, hook }
  }),
)

export const sortieEntries = sortieScenarios.flatMap((scene, i) => {
  const inventory = portraitInventory.scenarios.find((s) =>
    s.scenarioID === scene.id
  )!
  return (['a', 'b'] as const).map((side, j) => {
    const agent = inventory.sides[side].find((a) => a.entryVersionID != null)!
    return {
      versionID: agent.entryVersionID!,
      agentID: agent.agentID,
      ordinal: 1,
      roleKey: agent.role?.key ?? side,
      roleName: agent.role?.name ??
        (side === 'a' ? scene.sideAName : scene.sideBName),
      ownerID: 'sortie-demo',
      scenarioID: scene.id,
      side,
      active: true,
      eligible: true,
      wins: i === 2 ? 0 : 18 + i * 3 + j * 2,
      losses: i === 2 ? 0 : 10 + i * 2 + j,
      draws: i === 2 ? 0 : 2,
      streak: i === 2 ? 0 : 3 + j,
      bestStreak: i === 2 ? 0 : 7 + i,
    }
  })
})

export const demoOpponents: (Entry & { name: string })[] = sortieEntries
  .flatMap((entry, i) =>
    ['山月', '渡口', '青禾', '不系舟'].map((name, j) => ({
      ...entry,
      agentID: 8000 + i * 10 + j,
      versionID: 80000 + i * 10 + j,
      ownerID: `opponent-${j}`,
      name,
      wins: entry.wins ? entry.wins + j - 1 : j % 2,
      losses: entry.losses ? entry.losses + j : j % 2,
      streak: j + 1,
    }))
  )

export type SortieEntry = typeof sortieEntries[number]

// Mirrors the saved-version IDs served by preview-sortie.ts. Alternate agents
// start with no fictional ladder history; changing versions retains agentID.
export const sortieVersionEntries: SortieEntry[] = sortieEntries.flatMap(
  (base) => {
    const inventory = portraitInventory.scenarios.find((s) =>
      s.scenarioID === base.scenarioID
    )!
    return inventory.sides[base.side].filter((agent) => !agent.isArchived)
      .flatMap((agent) =>
        Array.from({ length: agent.versionCount }, (_, index) => ({
          ...base,
          ...(agent.agentID === base.agentID
            ? {}
            : { wins: 0, losses: 0, draws: 0, streak: 0, bestStreak: 0 }),
          agentID: agent.agentID,
          versionID: agent.agentID * 10 + index,
          ordinal: index + 1,
          roleKey: agent.role?.key ?? base.side,
          roleName: agent.role?.name ?? base.roleName,
        }))
      )
  },
)
