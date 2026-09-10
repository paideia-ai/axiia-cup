import { describe, expect, it } from 'vitest'

import { SOUND_PALETTES } from './sound-palettes'

import { readSoundPreferences, renderSound, SoundPolicy } from './sound'

describe('sound preferences', () => {
  it('recovers from corrupt or unavailable storage and bounds volume', () => {
    for (const value of [null, 'broken', 'null', '[]']) {
      expect(readSoundPreferences(value)).toEqual({
        enabled: true,
        volume: 0.25,
        responses: false,
        palette: 'clear',
      })
    }
    expect(
      readSoundPreferences('{"enabled":false,"volume":3,"responses":true}'),
    ).toEqual({ enabled: false, volume: 1, responses: true, palette: 'clear' })
    expect(readSoundPreferences('{"volume":-1}').volume).toBe(0)
  })
})

describe('sound event policy', () => {
  it('deduplicates completions across routes and SSE/poll sources by identity', () => {
    const policy = new SoundPolicy()
    expect(policy.accept('finish', '7', 0)).toBe(true)
    expect(policy.accept('finish', '7', 1000)).toBe(false)
    expect(policy.accept('finish', '8', 1001)).toBe(true)
    expect(policy.accept('dispatch', '7', 1002)).toBe(true)
  })
  it('consumes burst response events instead of replaying them later', () => {
    const policy = new SoundPolicy()
    expect(policy.accept('response', '7:1', 0)).toBe(true)
    expect(policy.accept('response', '7:2', 100)).toBe(false)
    expect(policy.accept('response', '7:2', 1000)).toBe(false)
    expect(policy.accept('response', '7:3', 1001)).toBe(true)
    expect(policy.accept('finish', '7', 1002)).toBe(true)
  })
})

describe('original sound buffers', () => {
  it('makes the click substantially stronger than hover', () => {
    const rms = (samples: Float32Array) =>
      Math.sqrt(
        samples.reduce((sum, value) => sum + value * value, 0) / samples.length,
      )
    expect(rms(renderSound('click', 48000))).toBeGreaterThan(
      rms(renderSound('hover', 48000)) * 3,
    )
  })
  it('throttles rapid hover entries without suppressing clicks', () => {
    const policy = new SoundPolicy()
    expect(policy.accept('hover', '1', 0)).toBe(true)
    expect(policy.accept('hover', '2', 100)).toBe(false)
    expect(policy.accept('click', '3', 101)).toBe(true)
    expect(policy.accept('hover', '4', 300)).toBe(true)
  })
  for (const sampleRate of [44100, 48000]) {
    for (
      const cue of [
        'save',
        'dispatch',
        'response',
        'finish',
        'hover',
        'click',
      ] as const
    ) {
      it(`${cue} at ${sampleRate} Hz has finite, audible, unclipped samples with quiet boundaries`, () => {
        const samples = renderSound(cue, sampleRate)
        let peak = 0
        let energy = 0
        for (const sample of samples) {
          expect(Number.isFinite(sample)).toBe(true)
          peak = Math.max(peak, Math.abs(sample))
          energy += sample * sample
        }
        expect(peak).toBeLessThan(0.95)
        expect(Math.sqrt(energy / samples.length)).toBeGreaterThan(
          cue === 'hover' ? 0.005 : 0.02,
        )
        expect(samples[0]).toBe(0)
        expect(Math.abs(samples[samples.length - 1])).toBeLessThan(0.001)
        expect(samples.length / sampleRate).toBeLessThan(0.75)
      })
    }
  }
})

describe('ten audition palettes', () => {
  it('restores a selected palette and safely defaults old/invalid preferences', () => {
    expect(readSoundPreferences('{"palette":"low"}').palette).toBe('low')
    expect(readSoundPreferences('{"palette":"missing"}').palette).toBe('clear')
  })
  it('provides ten distinct clicks and clean bounded buffers for every cue', () => {
    const fingerprints = new Set<string>()
    for (const palette of SOUND_PALETTES) {
      for (
        const cue of [
          'hover',
          'click',
          'save',
          'dispatch',
          'response',
          'finish',
        ] as const
      ) {
        const samples = renderSound(cue, 48000, 0, palette.id)
        let peak = 0
        let energy = 0
        for (const sample of samples) {
          expect(Number.isFinite(sample)).toBe(true)
          peak = Math.max(peak, Math.abs(sample))
          energy += sample * sample
        }
        expect(peak).toBeLessThanOrEqual(0.851)
        expect(Math.sqrt(energy / samples.length)).toBeGreaterThan(
          cue === 'hover' ? 0.005 : 0.02,
        )
        expect(Math.abs(samples[samples.length - 1])).toBeLessThan(0.001)
        if (cue === 'click') {
          fingerprints.add(
            Array.from(samples.slice(0, 512)).map((v) => v.toFixed(5)).join(
              ',',
            ),
          )
        }
      }
    }
    expect(fingerprints.size).toBe(10)
  })
})
