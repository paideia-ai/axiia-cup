import type {
  MatchDetail,
  ScenarioSummary,
  StandingsResponse,
  TournamentSummary,
} from '../api/types'
import { finishedMatch, finishedNoInquiryMatch } from '../testing/v34-fixtures'
import { scenarios, seedAgents } from './model'

// Authored demo data, never a production export. Editorial text stays in its
// existing scenario modules; the original pages consume their normal DTOs.
export const catalogFixtures: ScenarioSummary[] = scenarios.map((item, i) => ({
  id: item.id,
  title: item.title,
  subject: item.subject,
  sideAName: item.roles[0],
  sideBName: item.roles[1],
  sideALabel: item.descriptions[0],
  sideBLabel: item.descriptions[1],
  turnCount: 6,
  gateUnlocked: i !== 2,
  gateProgress: {
    a: { beaten: 1, needed: 1 },
    b: { beaten: i === 2 ? 0 : 1, needed: 1 },
  },
  onlineAt: i === 2 ? 1788900000 : 1788800000,
  ...(i !== 2
    ? {
      stats: { battleCount: 120 + i * 24, sideWinRate: { a: .52, b: .43 } },
    }
    : {}),
}))

const courtAgent = seedAgents().find((item) =>
  item.scenario === 'shangyang-court' && item.side === 0
)!
const court = structuredClone(finishedMatch)
court.summary.scenarioTitle = scenarios[3].title
court.summary.participants!.a.agentID = courtAgent.id
court.summary.participants!.a.ownerDisplayName = 'kesou'
const second = structuredClone(court)
second.summary.id = 9003
second.summary.kind = 'pvp'
second.summary.challengeID = 301
second.summary.challengeLeg = 2
const first = structuredClone(second)
first.summary.id = 9004
first.summary.challengeLeg = 1
const courtOpponent = seedAgents().find((item) =>
  item.scenario === 'shangyang-court' && item.side === 1
)!
// A paired challenge exchanges the player's sides; neither PvP participant is
// a PvE preset. The same role wins here, yielding one win and one loss for me.
first.summary.participants!.b = {
  ownerDisplayName: '山海',
  versionID: 3002,
  modelID: 'fixture-model',
  isMine: false,
}
second.summary.participants = {
  a: {
    ownerDisplayName: '山海',
    versionID: 3001,
    modelID: 'fixture-model',
    isMine: false,
  },
  b: {
    ownerDisplayName: 'kesou',
    agentID: courtOpponent.id,
    versionID: 1003,
    modelID: 'fixture-model',
    isMine: true,
  },
}

export const matchFixtures: MatchDetail[] = [
  first,
  second,
  {
    ...structuredClone(finishedNoInquiryMatch),
    summary: {
      ...structuredClone(court.summary),
      id: 9002,
    },
  },
  court,
]

export const tournamentFixtures: TournamentSummary[] = [
  {
    id: 41,
    scenarioID: 'shangyang-court',
    status: 'running',
    currentRound: 3,
    totalRounds: 5,
    phase: 'main',
    rounds: Array.from({ length: 5 }, (_, i) => ({
      id: 410 + i,
      roundNumber: i + 1,
      status: i < 2 ? 'done' : i === 2 ? 'running' : 'pending',
      phase: i < 2 ? 'qualifier' : 'main',
    })),
  },
  {
    id: 40,
    scenarioID: 'fengyiting-real',
    status: 'done',
    currentRound: 3,
    totalRounds: 3,
    phase: 'main',
    rounds: Array.from({ length: 3 }, (_, i) => ({
      id: 400 + i,
      roundNumber: i + 1,
      status: 'done',
      phase: i === 0 ? 'qualifier' : 'main',
    })),
  },
  {
    id: 39,
    scenarioID: 'honnoji-decision',
    status: 'pending',
    currentRound: 0,
    totalRounds: 5,
    rounds: [],
  },
]

export function standingsFixture(id: number): StandingsResponse {
  if (id === 39) return { entries: [] }
  return {
    entries: ['山海', 'kesou', '知微', '南川', '疏影', '墨白'].map((
      name,
      i,
    ) => ({
      playerID: `demo-${i}`,
      playerName: name,
      submissionIDs: [2001 + i * 2, 2002 + i * 2],
      wins: 6 - i,
      losses: i,
      matchesPlayed: 6,
      buchholz: 20 - i * 2,
      winRate: (6 - i) / 6 * 100,
      rank: i + 1,
    })),
  }
}
