// Shared presentation order for the catalog and My Agents. Unknown scenarios
// follow the reviewed ones, retaining their relative order from the server.
const SCENARIO_ORDER = [
  'shangyang-court',
  'honnoji-decision',
  'trolley-problem',
  'fengyiting-real',
  'legal-harbor-murder-jury',
]

const rank = new Map(SCENARIO_ORDER.map((id, index) => [id, index]))

export function orderScenarios<T extends { id: string }>(
  scenarios: readonly T[],
): T[] {
  return [...scenarios].sort((a, b) =>
    (rank.get(a.id) ?? SCENARIO_ORDER.length) -
    (rank.get(b.id) ?? SCENARIO_ORDER.length)
  )
}
