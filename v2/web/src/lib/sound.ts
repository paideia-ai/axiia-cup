import { rewardSound, type RewardSoundID } from './reward-sounds'
import { soundPalette, type SoundPaletteID } from './sound-palettes'

export type SoundCue =
  | 'save'
  | 'dispatch'
  | 'response'
  | 'finish'
  | 'hover'
  | 'click'
  | 'reward'

export interface SoundPreferences {
  enabled: boolean
  volume: number
  responses: boolean
  palette: SoundPaletteID
}

export const SOUND_STORAGE_KEY = 'axiia-sound-v1'
export const DEFAULT_SOUND_PREFERENCES: SoundPreferences = {
  enabled: true,
  volume: 0.25,
  responses: false,
  palette: 'clear',
}

export function readSoundPreferences(value: string | null): SoundPreferences {
  try {
    const parsed = JSON.parse(value ?? '{}')
    return {
      palette: soundPalette(parsed.palette).id,
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : true,
      responses: typeof parsed.responses === 'boolean'
        ? parsed.responses
        : false,
      volume:
        typeof parsed.volume === 'number' && Number.isFinite(parsed.volume)
          ? Math.max(0, Math.min(1, parsed.volume))
          : 0.25,
    }
  } catch {
    return { ...DEFAULT_SOUND_PREFERENCES }
  }
}

// Original, clean tonal cues. No noise layers, friction sweeps or saturation.
// Prepare once into buffers: playback never depends on a network round trip.
export function renderSound(
  cue: Exclude<SoundCue, 'reward'>,
  sampleRate: number,
  variant = 0,
  paletteID: SoundPaletteID = 'clear',
) {
  const palette = soundPalette(paletteID)
  const duration = {
    save: 0.26,
    dispatch: 0.34,
    response: 0.065,
    finish: 0.72,
    hover: 0.045,
    click: 0.11,
  }[cue]
  const samples = new Float32Array(Math.ceil(sampleRate * duration))
  const pluck = (t: number, hz: number, decay: number) => {
    if (t < 0) return 0
    hz *= palette.pitch
    const attack = Math.sin(Math.min(1, t / palette.attack) * Math.PI / 2) ** 2
    // Analytic, gentle pitch descent for the water-drop family. No noise/FM grit.
    const cycles = hz * (t + palette.bend * 0.015 * (1 - Math.exp(-t / 0.015)))
    let tone = 0
    for (let partial = 0; partial < palette.ratios.length; partial++) {
      tone += palette.levels[partial] *
        Math.sin(2 * Math.PI * palette.ratios[partial] * cycles)
    }
    return attack * Math.exp(-t / (decay * palette.decay)) * tone
  }
  for (let i = 0; i < samples.length; i++) {
    const t = i / sampleRate
    let value = 0
    if (cue === 'hover') {
      value = 0.065 * pluck(t, 610, 0.012)
    } else if (cue === 'click') {
      value = 0.28 * pluck(t, 330, 0.024) +
        0.08 * pluck(t, 660, 0.018)
    } else if (cue === 'save') {
      value = 0.3 * pluck(t, 330, 0.025) +
        0.2 * pluck(t - 0.025 * palette.spacing, 880, 0.052) +
        0.16 *
          pluck(t - 0.075 * palette.spacing, 1320 * palette.interval, 0.049)
    } else if (cue === 'dispatch') {
      value = 0.3 * pluck(t, 392, 0.065) +
        0.24 *
          pluck(t - 0.075 * palette.spacing, 523.25 * palette.interval, 0.065)
    } else if (cue === 'response') {
      // A low, dry tap with a soft attack. No bright partials or pitched melody.
      const attack = Math.sin(Math.min(1, t / 0.006) * Math.PI / 2) ** 2
      const hz = 245 + variant * 4
      value = attack * Math.exp(-t / 0.012) * (
        0.28 * Math.sin(2 * Math.PI * hz * t) +
        0.055 * Math.sin(2 * Math.PI * hz * 1.56 * t)
      )
    } else {
      value = 0.21 * pluck(t, 261.63, 0.11) +
        0.19 *
          pluck(t - 0.055 * palette.spacing, 523.25 * palette.interval, 0.13) +
        0.17 *
          pluck(t - 0.11 * palette.spacing, 659.25 * palette.interval, 0.14) +
        0.18 *
          pluck(t - 0.17 * palette.spacing, 1046.5 * palette.interval, 0.12)
    }
    const fade = Math.min(1, t / 0.001, (duration - t) / 0.018)
    samples[i] = value * 1.3 * Math.max(0, fade)
  }
  // Match RMS per cue across palettes for comparison at the same volume.
  // Preserve the quieter hover level, and cap peaks without clipping/distortion.
  const target = {
    hover: 0.017,
    click: 0.079,
    save: 0.075,
    dispatch: 0.09,
    response: 0.032,
    finish: 0.075,
  }[cue]
  let energy = 0
  let peak = 0
  for (const sample of samples) {
    energy += sample * sample
    peak = Math.max(peak, Math.abs(sample))
  }
  const scale = Math.min(
    target / Math.sqrt(energy / samples.length),
    0.85 / peak,
  )
  for (let i = 0; i < samples.length; i++) samples[i] *= scale
  return samples
}

export class SoundPolicy {
  private seen = new Set<string>()
  private lastResponse = -Infinity
  private lastHover = -Infinity

  accept(cue: SoundCue, key: string, now: number, throttle = true) {
    const identity = `${cue}:${key}`
    if (this.seen.has(identity)) return false
    this.seen.add(identity)
    // Bound session memory even on very long spectating sessions.
    if (this.seen.size > 4096) {
      this.seen.delete(this.seen.values().next().value!)
    }
    if (throttle && cue === 'hover') {
      if (now - this.lastHover < 250) return false
      this.lastHover = now
    }
    if (throttle && cue === 'response') {
      if (now - this.lastResponse < 300) return false
      this.lastResponse = now
    }
    return true
  }
}

export class SoundEngine {
  private context: AudioContext | null = null
  private gain: GainNode | null = null
  private rewardGain: GainNode | null = null
  private buffers = new Map<string, AudioBuffer>()
  private sources = new Set<AudioBufferSourceNode>()
  private responseSources = new Set<AudioBufferSourceNode>()
  private hoverSources = new Set<AudioBufferSourceNode>()
  private rewardData = new Map<RewardSoundID, Promise<ArrayBuffer | null>>()
  private rewardDecode = new Map<RewardSoundID, Promise<boolean>>()
  private nextMilestone = 0
  private variant = 0
  private policy = new SoundPolicy()
  preferences = { ...DEFAULT_SOUND_PREFERENCES }

  // Called inside user gestures, before any async API work.
  unlock = async (): Promise<boolean> => {
    try {
      if (!this.context || this.context.state === 'closed') {
        this.context = new AudioContext()
        this.gain = this.context.createGain()
        this.gain.gain.value = this.preferences.volume
        this.gain.connect(this.context.destination)
        this.rewardGain = this.context.createGain()
        // Triple the payout level at the default volume, with unity as the cap.
        // The approved sample remains unchanged and retains its peak headroom.
        this.rewardGain.gain.value = Math.min(1, this.preferences.volume * 3)
        this.rewardGain.connect(this.context.destination)
      }
      if (this.context.state === 'suspended') await this.context.resume()
      return this.context.state === 'running'
    } catch {
      return false
    }
  }

  configure(preferences: SoundPreferences) {
    if (preferences.palette !== this.preferences.palette) this.stop()
    this.preferences = preferences
    if (this.gain && this.context) {
      this.gain.gain.setTargetAtTime(
        preferences.volume,
        this.context.currentTime,
        0.015,
      )
    }
    if (this.rewardGain && this.context) {
      this.rewardGain.gain.setTargetAtTime(
        Math.min(1, preferences.volume * 3),
        this.context.currentTime,
        0.015,
      )
    }
    if (!preferences.enabled || preferences.volume === 0) this.stop()
    if (!preferences.responses) {
      for (const source of this.responseSources) source.stop()
      this.responseSources.clear()
    }
  }

  play = (
    cue: SoundCue,
    key: string,
    audition = false,
    paletteID?: SoundPaletteID,
    rewardID: RewardSoundID = 'cashout-b',
  ): boolean => {
    if (!this.policy.accept(cue, key, performance.now(), !audition)) {
      return false
    }
    const ctx = this.context
    if (
      !this.preferences.enabled || this.preferences.volume === 0 ||
      (!audition && cue === 'response' && !this.preferences.responses) ||
      document.hidden || !document.hasFocus() || !ctx ||
      ctx.state !== 'running' || !this.gain
    ) return false
    try {
      if (cue === 'click') {
        for (const source of this.hoverSources) source.stop()
        this.hoverSources.clear()
      }
      if (cue === 'finish' || cue === 'reward') {
        for (const source of this.responseSources) source.stop()
        this.responseSources.clear()
      }
      const source = ctx.createBufferSource()
      const variant = cue === 'response' ? this.variant++ % 3 : 0
      const palette = paletteID ?? this.preferences.palette
      const bufferKey = cue === 'reward'
        ? `reward:${rewardID}`
        : `${palette}:${cue}:${variant}`
      let buffer = this.buffers.get(bufferKey)
      if (!buffer) {
        if (cue === 'reward') return false
        const samples = renderSound(cue, ctx.sampleRate, variant, palette)
        buffer = ctx.createBuffer(1, samples.length, ctx.sampleRate)
        buffer.copyToChannel(samples, 0)
        this.buffers.set(bufferKey, buffer)
      }
      source.buffer = buffer
      source.connect(
        cue === 'reward' && this.rewardGain ? this.rewardGain : this.gain,
      )
      const immediate = cue === 'response' || cue === 'hover' ||
        cue === 'click' || cue === 'reward'
      const start = immediate
        ? ctx.currentTime
        : Math.max(ctx.currentTime, this.nextMilestone)
      // A burst of milestones should never turn into a long audio backlog.
      if (start - ctx.currentTime > 0.8) {
        source.disconnect()
        return false
      }
      if (!immediate) {
        this.nextMilestone = start + source.buffer.duration + 0.025
      }
      this.sources.add(source)
      if (cue === 'response') this.responseSources.add(source)
      if (cue === 'hover') this.hoverSources.add(source)
      source.onended = () => {
        this.sources.delete(source)
        this.responseSources.delete(source)
        this.hoverSources.delete(source)
        source.disconnect()
      }
      source.start(start)
      return true
    } catch {
      return false
    }
  }

  prefetchReward = (
    id: RewardSoundID = 'cashout-b',
  ): Promise<ArrayBuffer | null> => {
    const asset = rewardSound(id).asset
    if (!asset) return Promise.resolve(null)
    const pending = this.rewardData.get(id)
    if (pending) return pending
    const request = fetch(asset, { signal: AbortSignal.timeout(5000) })
      .then((response) => {
        if (!response.ok) throw new Error('Reward audio unavailable')
        return response.arrayBuffer()
      })
      .catch(() => {
        this.rewardData.delete(id)
        return null
      })
    this.rewardData.set(id, request)
    return request
  }

  prepareReward = async (id: RewardSoundID = 'cashout-b'): Promise<boolean> => {
    if (!await this.unlock() || !this.context) return false
    if (this.buffers.has(`reward:${id}`)) return true
    const pending = this.rewardDecode.get(id)
    if (pending) return pending
    const context = this.context
    const request = (async () => {
      try {
        const data = await this.prefetchReward(id)
        if (!data) return false
        this.buffers.set(
          `reward:${id}`,
          await context.decodeAudioData(data.slice(0)),
        )
        return true
      } catch {
        this.rewardData.delete(id)
        return false
      } finally {
        this.rewardDecode.delete(id)
      }
    })()
    this.rewardDecode.set(id, request)
    return request
  }

  playReward = (id: RewardSoundID, key: string) =>
    this.play('reward', key, false, undefined, id)

  stop = () => {
    for (const source of this.sources) source.stop()
    this.sources.clear()
    this.responseSources.clear()
    this.hoverSources.clear()
    this.nextMilestone = 0
  }
}
