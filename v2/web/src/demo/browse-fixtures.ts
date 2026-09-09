import type {
  MatchDetail,
  ScenarioSummary,
  StandingsResponse,
  TournamentSummary,
} from '../api/types'
import snapshot from './public-snapshot.json'

// Published, sanitized API snapshot. No invented statistics or match dialogue.
export { snapshot }
export const catalogFixtures = snapshot.scenarios as ScenarioSummary[]
export const matchFixtures = snapshot.matches as unknown as MatchDetail[]
export const tournamentFixtures = snapshot.tournaments as TournamentSummary[]
export function standingsFixture(id: number): StandingsResponse {
  return (snapshot.standings as Record<string, StandingsResponse>)[id] ??
    { entries: [] }
}
