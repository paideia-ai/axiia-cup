// Original tonal synthesis, adapted from Keso's 清透轻点 demo at c28c9a8.
// Reward B and typing feedback follow the final approved journey demo.
import { renderTypingSound } from './typing/audio'

export const REWARD_SOUND_URL = '/sounds/reward-cashout-b.wav'
export type SoundCue =
  | 'save'
  | 'dispatch'
  | 'output'
  | 'finish'
  | 'reward'
  | 'type'
  | 'delete'
  | 'hover'
  | 'click'

export interface SoundPreferences {
  enabled: boolean
  volume: number
}

export const SOUND_STORAGE_KEY = 'axiia-sound-v1'
export const DEFAULT_SOUND_PREFERENCES: SoundPreferences = {
  enabled: true,
  volume: 0.25,
}

export function readSoundPreferences(value: string | null): SoundPreferences {
  try {
    const parsed = JSON.parse(value ?? '{}')
    return {
      enabled: typeof parsed?.enabled === 'boolean' ? parsed.enabled : true,
      volume:
        typeof parsed?.volume === 'number' && Number.isFinite(parsed.volume)
          ? Math.max(0, Math.min(1, parsed.volume))
          : 0.25,
    }
  } catch {
    return { ...DEFAULT_SOUND_PREFERENCES }
  }
}

// Prepare small buffers lazily and cache them. No media fetch or decoding can
// delay the save/dispatch/claim request. Soft attacks and short tails avoid clicks.
export function renderSound(
  cue: Exclude<SoundCue, 'reward'>,
  sampleRate: number,
  variant = 0,
) {
  if (cue === 'type' || cue === 'delete') {
    return renderTypingSound(cue, sampleRate, variant)
  }
  const duration = {
    save: 0.26,
    dispatch: 0.34,
    output: 0.065,
    finish: 0.72,
    hover: 0.045,
    click: 0.11,
  }[cue]
  const samples = new Float32Array(Math.ceil(sampleRate * duration))
  const pluck = (t: number, hz: number, decay: number) => {
    if (t < 0) return 0
    const attack = Math.sin(Math.min(1, t / 0.005) * Math.PI / 2) ** 2
    const phase = 2 * Math.PI * hz * t
    return attack * Math.exp(-t / decay) *
      (Math.sin(phase) + 0.12 * Math.sin(2 * phase) +
        0.025 * Math.sin(3 * phase))
  }
  for (let i = 0; i < samples.length; i++) {
    const t = i / sampleRate
    let value: number
    switch (cue) {
      case 'hover':
        value = 0.065 * pluck(t, 610, 0.012)
        break
      case 'click':
        value = 0.28 * pluck(t, 330, 0.024) + 0.08 * pluck(t, 660, 0.018)
        break
      case 'save':
        value = 0.3 * pluck(t, 330, 0.025) +
          0.2 * pluck(t - 0.025, 880, 0.052) +
          0.16 * pluck(t - 0.075, 1320, 0.049)
        break
      case 'dispatch':
        value = 0.3 * pluck(t, 392, 0.065) +
          0.24 * pluck(t - 0.075, 523.25, 0.065)
        break
      case 'output': {
        const attack = Math.sin(Math.min(1, t / 0.006) * Math.PI / 2) ** 2
        const phase = 2 * Math.PI * (245 + variant * 4) * t
        value = attack * Math.exp(-t / 0.012) *
          (0.28 * Math.sin(phase) + 0.055 * Math.sin(phase * 1.56))
        break
      }
      case 'finish':
        value = 0.21 * pluck(t, 261.63, 0.11) +
          0.19 * pluck(t - 0.055, 523.25, 0.13) +
          0.17 * pluck(t - 0.11, 659.25, 0.14) +
          0.18 * pluck(t - 0.17, 1046.5, 0.12)
        break
    }
    samples[i] = value *
      Math.max(0, Math.min(1, t / 0.001, (duration - t) / 0.018))
  }
  const target = {
    save: 0.075,
    dispatch: 0.09,
    output: 0.032,
    finish: 0.075,
    hover: 0.017,
    click: 0.079,
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
  private lastOutput = -Infinity
  private lastTyping = -Infinity
  private lastHover = -Infinity

  accept(cue: SoundCue, key: string, now: number) {
    const identity = `${cue}:${key}`
    if (this.seen.has(identity)) return false
    this.seen.add(identity)
    if (this.seen.size > 4096) {
      this.seen.delete(this.seen.values().next().value!)
    }
    if (cue === 'output') {
      if (now - this.lastOutput < 300) return false
      this.lastOutput = now
    }
    if (cue === 'type' || cue === 'delete') {
      if (now - this.lastTyping < 50) return false
      this.lastTyping = now
    }
    if (cue === 'hover') {
      if (now - this.lastHover < 250) return false
      this.lastHover = now
    }
    return true
  }
}

// Persist milestone identities across tabs and SSE/poll sources. Completion
// callers use a Web Lock so simultaneous background tabs cannot both claim it.
function isMilestone(cue: SoundCue): boolean {
  return cue === 'save' || cue === 'dispatch' || cue === 'finish' ||
    cue === 'reward'
}

function claimMilestone(cue: SoundCue, key: string): boolean {
  if (!isMilestone(cue)) return true
  try {
    const stored: unknown = JSON.parse(
      localStorage.getItem('axiia-sound-events-v1') ?? '[]',
    )
    const seen = Array.isArray(stored)
      ? stored.filter((value): value is string => typeof value === 'string')
      : []
    const identity = `${cue}:${key}`
    if (seen.includes(identity)) return false
    localStorage.setItem(
      'axiia-sound-events-v1',
      JSON.stringify([...seen.slice(-255), identity]),
    )
  } catch { /* Focus and in-memory dedup still work without storage. */ }
  return true
}

export class SoundEngine {
  private context: AudioContext | null = null
  private gain: GainNode | null = null
  private rewardGain: GainNode | null = null
  private rewardData: Promise<ArrayBuffer | null> | null = null
  private rewardDecode: Promise<boolean> | null = null
  private buffers = new Map<string, AudioBuffer>()
  private sources = new Map<AudioBufferSourceNode, SoundCue>()
  private nextMilestone = 0
  private variant = 0
  private policy = new SoundPolicy()
  preferences = { ...DEFAULT_SOUND_PREFERENCES }

  // Synchronous entry on a user gesture, before any API await.
  unlock = (): void => {
    try {
      if (!this.context || this.context.state === 'closed') {
        this.context = new AudioContext()
        this.gain = this.context.createGain()
        this.gain.gain.value = this.preferences.volume
        this.gain.connect(this.context.destination)
        this.rewardGain = this.context.createGain()
        this.rewardGain.gain.value = Math.min(1, this.preferences.volume * 3)
        this.rewardGain.connect(this.context.destination)
      }
      if (this.context.state === 'suspended') {
        void this.context.resume().catch(() => {})
      }
      void this.prepareReward()
    } catch {
      // Unsupported/blocked audio must never interfere with a business action.
    }
  }

  configure(preferences: SoundPreferences) {
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
  }

  play = (cue: SoundCue, key: string, audition = false): boolean => {
    // Consume before checking mute/visibility/readiness: there is no backlog.
    if (!this.policy.accept(cue, key, performance.now())) return false
    const ctx = this.context
    if (
      !this.preferences.enabled || this.preferences.volume === 0 ||
      typeof document === 'undefined' ||
      (cue !== 'finish' && (document.hidden || !document.hasFocus())) ||
      !ctx || ctx.state !== 'running' || !this.gain
    ) return false
    if (!audition && !claimMilestone(cue, key)) return false
    try {
      if (cue === 'click') this.stop('hover')
      if (cue === 'finish' || cue === 'reward') this.stop('output')
      // Output ticks must never obscure a milestone already playing/queued.
      if (cue === 'output' && ctx.currentTime < this.nextMilestone) return false
      const variant = cue === 'output' ? this.variant++ % 3 : 0
      const bufferKey = `${cue}:${variant}`
      let buffer = this.buffers.get(bufferKey)
      if (!buffer) {
        if (cue === 'reward') return false
        const samples = renderSound(cue, ctx.sampleRate, variant)
        buffer = ctx.createBuffer(1, samples.length, ctx.sampleRate)
        buffer.copyToChannel(samples, 0)
        this.buffers.set(bufferKey, buffer)
      }
      const start = isMilestone(cue) && cue !== 'reward'
        ? Math.max(ctx.currentTime, this.nextMilestone)
        : ctx.currentTime
      if (start - ctx.currentTime > 0.8) return false
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.connect(
        cue === 'reward' && this.rewardGain ? this.rewardGain : this.gain,
      )
      if (isMilestone(cue) && cue !== 'reward') {
        this.nextMilestone = start + buffer.duration + 0.025
      }
      this.sources.set(source, cue)
      source.onended = () => {
        this.sources.delete(source)
        source.disconnect()
      }
      source.start(start)
      return true
    } catch {
      return false
    }
  }

  prefetchReward = (): Promise<ArrayBuffer | null> => {
    if (this.rewardData) return this.rewardData
    this.rewardData = fetch(REWARD_SOUND_URL, {
      signal: AbortSignal.timeout(5000),
    })
      .then((response) => {
        if (!response.ok) throw new Error('Reward audio unavailable')
        return response.arrayBuffer()
      }).catch(() => {
        this.rewardData = null
        return null
      })
    return this.rewardData
  }

  prepareReward = (): Promise<boolean> => {
    if (this.buffers.has('reward:0')) return Promise.resolve(true)
    if (this.rewardDecode) return this.rewardDecode
    const context = this.context
    if (!context) return Promise.resolve(false)
    this.rewardDecode = this.prefetchReward().then(async (data) => {
      if (!data) return false
      this.buffers.set('reward:0', await context.decodeAudioData(data.slice(0)))
      return true
    }).catch(() => {
      this.rewardData = null
      return false
    }).finally(() => {
      this.rewardDecode = null
    })
    return this.rewardDecode
  }

  // Switching windows never cuts short an already playing completion alert.
  stopForeground = () => {
    for (const [source, cue] of this.sources) {
      if (cue === 'finish') continue
      try {
        source.stop()
      } catch { /* Already ended. */ }
      this.sources.delete(source)
    }
    if (this.sources.size === 0) this.nextMilestone = 0
  }

  stop = (cue?: SoundCue) => {
    for (const [source, kind] of this.sources) {
      if (cue != null && kind !== cue) continue
      try {
        source.stop()
      } catch { /* Already ended. */ }
      this.sources.delete(source)
    }
    if (cue == null) this.nextMilestone = 0
  }
}

const engine = new SoundEngine()
const listeners = new Set<() => void>()
let preferences: SoundPreferences | null = null
let eventNumber = 0

export function getSoundPreferences(): SoundPreferences {
  if (preferences == null) {
    try {
      preferences = readSoundPreferences(
        localStorage.getItem(SOUND_STORAGE_KEY),
      )
    } catch {
      preferences = { ...DEFAULT_SOUND_PREFERENCES }
    }
    engine.configure(preferences)
  }
  return preferences
}

export function subscribeSound(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function updateSoundPreferences(update: Partial<SoundPreferences>) {
  preferences = readSoundPreferences(
    JSON.stringify({ ...getSoundPreferences(), ...update }),
  )
  engine.configure(preferences)
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, JSON.stringify(preferences))
  } catch { /* Session fallback. */ }
  for (const listener of listeners) listener()
}

export function unlockAudio(): void {
  getSoundPreferences()
  engine.unlock()
}

export function playSound(
  cue: SoundCue,
  key = `interaction:${++eventNumber}`,
  audition = false,
): boolean {
  getSoundPreferences()
  return engine.play(cue, key, audition)
}

// Attached only to the product's save and battle buttons. Hover is not a user
// activation, so it deliberately never creates or resumes an AudioContext.
export function playButtonHover(event: { pointerType: string }): void {
  if (event.pointerType === 'mouse') playSound('hover')
}

// Install once above routes. Keyboard and pointer gestures support direct links
// into ongoing games, where there was no dispatch click in this tab.
export function installSoundListeners(): () => void {
  void engine.prefetchReward()
  const onStorage = (event: StorageEvent) => {
    if (event.key !== SOUND_STORAGE_KEY && event.key !== null) return
    preferences = readSoundPreferences(event.newValue)
    engine.configure(preferences)
    for (const listener of listeners) listener()
  }
  const onVisibility = () => {
    if (document.hidden) engine.stopForeground()
  }
  const onBlur = () => engine.stopForeground()
  globalThis.addEventListener('pointerdown', unlockAudio, { passive: true })
  globalThis.addEventListener('keydown', unlockAudio)
  globalThis.addEventListener('blur', onBlur)
  globalThis.addEventListener('storage', onStorage)
  document.addEventListener('visibilitychange', onVisibility)
  return () => {
    globalThis.removeEventListener('pointerdown', unlockAudio)
    globalThis.removeEventListener('keydown', unlockAudio)
    globalThis.removeEventListener('blur', onBlur)
    globalThis.removeEventListener('storage', onStorage)
    document.removeEventListener('visibilitychange', onVisibility)
    engine.stop()
  }
}

export function prepareRewardSound(): Promise<boolean> {
  unlockAudio()
  return engine.prepareReward()
}
