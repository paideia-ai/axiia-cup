import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { renderTypingSound, type Stroke } from './typing/audio'

// Frozen from the approved demo assets/renderer, independently of this port.
const typingHashes: Record<Stroke, string> = {
  type: '9464f34822f12213023b59046ef5f2555514a0fba04dbb2487049d977dd60f8d',
  delete: '2177d23007c03da67c02b872e265dd0ae4267eed376a148445dffa5ad1457201',
  enter: '0296d09810375e3171011931be35d9a4fd05523075e1c03bfcbce0d097cd9688',
  paste: '0c82b145deec5eb64e0bf0263f314a45d1cf62ab9ca0c00331f67a404463e236',
}

describe('approved demo audio identity', () => {
  it('ships the exact stereo B cash-out recording', () => {
    const wav = readFileSync(
      new URL('../../public/sounds/reward-cashout-b.wav', import.meta.url),
    )
    expect(createHash('sha256').update(wav).digest('hex')).toBe(
      '43ee4c05e2b9a9837c7050ad871a53db1cedd25dd4bf4112770be95309d81b63',
    )
    expect(wav.readUInt16LE(22)).toBe(2)
    expect(wav.readUInt32LE(24)).toBe(44100)
  })
  for (const stroke of Object.keys(typingHashes) as Stroke[]) {
    it(`preserves the approved ${stroke} waveform`, () => {
      const samples = renderTypingSound(stroke, 48000)
      expect(
        createHash('sha256').update(new Uint8Array(samples.buffer)).digest(
          'hex',
        ),
      )
        .toBe(typingHashes[stroke])
    })
  }
})
