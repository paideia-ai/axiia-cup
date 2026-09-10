import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { REWARD_SOUNDS, rewardSound } from './reward-sounds'

describe('selected cross-session payout', () => {
  it('uses the exact B file selected by the user, with no other candidates', () => {
    expect(REWARD_SOUNDS).toHaveLength(1)
    const spec = rewardSound('cashout-b')
    const file = readFileSync(
      new URL(`../../public${spec.asset}`, import.meta.url),
    )
    expect(createHash('sha256').update(file).digest('hex')).toBe(
      '43ee4c05e2b9a9837c7050ad871a53db1cedd25dd4bf4112770be95309d81b63',
    )
    expect(file.readUInt16LE(22)).toBe(2)
    expect(file.readUInt32LE(24)).toBe(44100)
    expect(file.readUInt32LE(40) / 4 / 44100).toBe(spec.duration)
  })
})
