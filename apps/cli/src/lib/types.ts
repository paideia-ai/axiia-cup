import type { User } from '@axiia/shared'

export type AuthResponse = {
  token: string
  user: User
}

export type StartRoundResponse = {
  byeSubmissions: number[]
  matches: Array<{
    id: number
    status: string
    subAId: number
    subBId: number
  }>
  round: {
    id: number
    roundNumber: number
  }
  tournament: {
    id: number
  }
}
