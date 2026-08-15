import { describe, expect, it } from 'vitest'

import type { GateProgressDTO } from '../api/types'
import { gateMet, sideMet, sideProgressText } from './gate'

describe('v3.4 #65/#77/#78 per-side progression gate', () => {
  it.each(
    [
      [{ beaten: 0, needed: 1 }, false, '0/1'],
      [{ beaten: 1, needed: 1 }, true, '1/1'],
      [{ beaten: 3, needed: 1 }, true, '1/1'],
    ] as const,
  )(
    'derives and caps side progress for %o',
    (side, met, label) => {
      expect(sideMet(side)).toBe(met)
      expect(sideProgressText(side)).toBe(label)
    },
  )

  it('requires both sides independently instead of summing their wins', () => {
    const progress: GateProgressDTO = {
      a: { beaten: 2, needed: 1 },
      b: { beaten: 0, needed: 1 },
    }

    expect(gateMet(progress)).toBe(false)
    expect(gateMet({ ...progress, b: { beaten: 1, needed: 1 } })).toBe(true)
  })
})
