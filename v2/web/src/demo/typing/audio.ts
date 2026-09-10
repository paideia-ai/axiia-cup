export type Stroke = 'type' | 'delete' | 'enter' | 'paste'

// Original tonal synthesis, adapted to typing from the two local sound demos.
// Shorter tails and lower gain keep a paragraph from becoming a melody.
const tone = { pitch: 450, attack: 0.012, duration: 0.075, harmonic: 0.035 }

export class TypingAudio {
  private context?: AudioContext
  private master?: GainNode
  private sources = new Set<AudioBufferSourceNode>()
  private buffers = new Map<string, AudioBuffer>()
  private last = -Infinity
  private sequence = 0
  private enabled = true

  configure(enabled: boolean, volume: number) {
    this.enabled = enabled
    if (!enabled) this.stop()
    if (this.context && this.master) {
      this.master.gain.setTargetAtTime(
        enabled ? volume / 100 : 0,
        this.context.currentTime,
        0.005,
      )
    }
  }

  async unlock(volume: number): Promise<boolean> {
    try {
      if (!this.context) {
        this.context = new AudioContext()
        this.master = this.context.createGain()
        this.master.gain.value = this.enabled ? volume / 100 : 0
        this.master.connect(this.context.destination)
      }
      if (this.context.state === 'suspended') await this.context.resume()
      return this.context.state === 'running'
    } catch {
      return false
    }
  }

  play(stroke: Stroke = 'type') {
    const ctx = this.context
    if (
      !ctx || !this.master || !this.enabled || ctx.state !== 'running' ||
      document.hidden || !document.hasFocus()
    ) return
    // Discard repeats faster than 28 ms; never enqueue an audio backlog.
    if (ctx.currentTime - this.last < 0.028) return
    this.last = ctx.currentTime
    const variation = this.sequence++ % 3
    const key = `${stroke}:${variation}`
    let buffer = this.buffers.get(key)
    if (!buffer) {
      const duration = tone.duration * (stroke === 'enter' ? 1.5 : 1)
      const pitch = tone.pitch * [1, 0.97, 1.025][variation] *
        (stroke === 'delete' ? 0.72 : stroke === 'enter' ? 0.84 : 1)
      buffer = ctx.createBuffer(
        1,
        Math.ceil(ctx.sampleRate * duration),
        ctx.sampleRate,
      )
      const samples = buffer.getChannelData(0)
      for (let i = 0; i < samples.length; i++) {
        const t = i / ctx.sampleRate
        const attack = Math.min(1, t / tone.attack)
        const envelope = Math.sin(attack * Math.PI / 2) ** 2 *
          Math.exp(-6 * t / duration) * Math.min(1, (duration - t) / 0.008)
        const phase = 2 * Math.PI * pitch * t
        const wave = Math.sin(phase) + tone.harmonic * Math.sin(phase * 2)
        samples[i] = wave * envelope * 0.3 * (stroke === 'paste' ? 0.65 : 1)
      }
      this.buffers.set(key, buffer)
    }
    if (this.sources.size >= 5) return
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(this.master)
    this.sources.add(source)
    source.onended = () => {
      source.disconnect()
      this.sources.delete(source)
    }
    source.start()
  }

  stop() {
    for (const source of this.sources) source.stop()
    this.sources.clear()
  }

  dispose() {
    this.stop()
    void this.context?.close().catch(() => {})
  }
}
