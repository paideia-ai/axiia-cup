import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  DEFAULT_SOUND_PREFERENCES,
  readSoundPreferences,
  renderSound,
  type SoundCue,
  SoundEngine,
  SoundPolicy,
} from './sound'

describe('sound preferences', () => {
  it('uses quiet defaults for absent, invalid, and hostile storage', () => {
    for (
      const value of [
        null,
        'broken',
        'null',
        '[]',
        '4',
        '{"enabled":"yes","volume":"loud"}',
      ]
    ) {
      expect(readSoundPreferences(value)).toEqual(DEFAULT_SOUND_PREFERENCES)
    }
    expect(readSoundPreferences('{"enabled":false,"outputs":true,"volume":3}'))
      .toEqual({ enabled: false, outputs: true, volume: 1 })
    expect(readSoundPreferences('{"volume":-3}').volume).toBe(0)
  })
})

describe('original sound buffers', () => {
  it('renders finite, bounded, non-silent cues with silent attacks and short tails', () => {
    for (const rate of [44100, 48000]) {
      for (
        const cue of [
          'save',
          'dispatch',
          'output',
          'finish',
          'reward',
        ] as SoundCue[]
      ) {
        const data = renderSound(cue, rate)
        expect(data.length / rate).toBeLessThanOrEqual(0.73)
        expect(data[0]).toBe(0)
        expect(Math.abs(data[data.length - 1])).toBeLessThan(0.001)
        let energy = 0
        let finite = true
        let peak = 0
        for (const value of data) {
          finite &&= Number.isFinite(value)
          peak = Math.max(peak, Math.abs(value))
          energy += value * value
        }
        expect(finite).toBe(true)
        expect(peak).toBeLessThanOrEqual(0.851)
        expect(energy / data.length).toBeGreaterThan(0.0005)
      }
    }
  })
})

describe('sound event policy', () => {
  it('consumes repeated and throttled outputs permanently', () => {
    const policy = new SoundPolicy()
    expect(policy.accept('output', '1:1', 0)).toBe(true)
    expect(policy.accept('output', '1:2', 100)).toBe(false)
    expect(policy.accept('output', '1:2', 500)).toBe(false)
    expect(policy.accept('output', '1:3', 500)).toBe(true)
    expect(policy.accept('finish', '1', 501)).toBe(true)
    expect(policy.accept('finish', '1', 900)).toBe(false)
  })
})

describe('playback lifecycle', () => {
  const sources: {
    start: ReturnType<typeof vi.fn>
    stop: ReturnType<typeof vi.fn>
  }[] = []
  let focused = true
  let hidden = false
  let context: {
    state: string
    currentTime: number
    sampleRate: number
    destination: object
    resume: ReturnType<typeof vi.fn>
    createGain: ReturnType<typeof vi.fn>
    createBuffer: ReturnType<typeof vi.fn>
    createBufferSource: ReturnType<typeof vi.fn>
  }
  beforeEach(() => {
    sources.length = 0
    focused = true
    hidden = false
    const storage = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    })
    vi.stubGlobal('document', {
      get hidden() {
        return hidden
      },
      hasFocus: () => focused,
    })
    context = {
      state: 'running',
      currentTime: 0,
      sampleRate: 44100,
      destination: {},
      resume: vi.fn().mockResolvedValue(undefined),
      createGain: vi.fn(() => ({
        gain: { value: 0, setTargetAtTime: vi.fn() },
        connect: vi.fn(),
      })),
      createBuffer: vi.fn((
        _channels: number,
        length: number,
        rate: number,
      ) => ({ duration: length / rate, copyToChannel: vi.fn() })),
      createBufferSource: vi.fn(() => {
        const source = {
          buffer: null,
          connect: vi.fn(),
          disconnect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
          onended: null,
        }
        sources.push(source)
        return source
      }),
    }
    vi.stubGlobal('AudioContext', function () {
      return context
    })
  })
  afterEach(() => vi.unstubAllGlobals())

  it('does not create a context until a gesture or replay blocked events later', () => {
    const engine = new SoundEngine()
    expect(engine.play('save', 'before-gesture')).toBe(false)
    expect(context.createGain).not.toHaveBeenCalled()
    engine.unlock()
    expect(engine.play('save', 'before-gesture')).toBe(false)
    expect(engine.play('save', 'new-save')).toBe(true)
  })

  it('consumes muted and background events with no unmute/focus backlog', () => {
    const engine = new SoundEngine()
    engine.unlock()
    engine.configure({ ...DEFAULT_SOUND_PREFERENCES, enabled: false })
    expect(engine.play('finish', 'muted')).toBe(false)
    engine.configure(DEFAULT_SOUND_PREFERENCES)
    expect(engine.play('finish', 'muted')).toBe(false)
    hidden = true
    expect(engine.play('finish', 'hidden')).toBe(false)
    hidden = false
    expect(engine.play('finish', 'hidden')).toBe(false)
    focused = false
    expect(engine.play('reward', 'unfocused')).toBe(false)
    focused = true
    expect(engine.play('reward', 'unfocused')).toBe(false)
    expect(sources).toHaveLength(0)
  })

  it('sequences express save and dispatch without delaying the app, and stops on mute', () => {
    const engine = new SoundEngine()
    engine.unlock()
    expect(engine.play('save', 'version')).toBe(true)
    expect(engine.play('dispatch', 'match')).toBe(true)
    expect(sources[0].start).toHaveBeenCalledWith(0)
    expect(sources[1].start.mock.calls[0][0]).toBeGreaterThan(0.26)
    engine.configure({ ...DEFAULT_SOUND_PREFERENCES, enabled: false })
    expect(sources.every((source) => source.stop.mock.calls.length === 1)).toBe(
      true,
    )
  })

  it('gives milestones priority over output and deduplicates milestones across engines', () => {
    const first = new SoundEngine()
    first.unlock()
    first.configure({ ...DEFAULT_SOUND_PREFERENCES, outputs: true })
    expect(first.play('output', '1:1')).toBe(true)
    expect(first.play('finish', 'match')).toBe(true)
    expect(sources[0].stop).toHaveBeenCalledOnce()
    const otherTab = new SoundEngine()
    otherTab.unlock()
    expect(otherTab.play('finish', 'match')).toBe(false)
  })

  it('keeps output independently muted and survives blocked audio/storage', () => {
    const engine = new SoundEngine()
    engine.unlock()
    expect(engine.play('output', 'quiet')).toBe(false)
    vi.stubGlobal('localStorage', {
      getItem() {
        throw new Error('disabled')
      },
    })
    expect(engine.play('reward', 'claim')).toBe(true)
    vi.stubGlobal('AudioContext', function () {
      throw new Error('not supported')
    })
    const unavailable = new SoundEngine()
    expect(() => unavailable.unlock()).not.toThrow()
    expect(unavailable.play('finish', 'failed-context')).toBe(false)
  })
})
