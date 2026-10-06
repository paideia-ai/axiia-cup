// Export the actual product renderer. Do not resynthesize, normalize, or fade it.
import { renderSound } from '../../../src/lib/sound.ts'

const sampleRate = 44_100
const channels = 2
const output = new URL('./11-original-chime.wav', import.meta.url)
const samples = renderSound('achievement', sampleRate)
const tolerance = 1 / 32767
const bytes = new Uint8Array(44 + samples.length * channels * 2)
const view = new DataView(bytes.buffer)
const encoder = new TextEncoder()
const ascii = (offset: number, text: string) => {
  bytes.set(encoder.encode(text), offset)
}
ascii(0, 'RIFF')
view.setUint32(4, bytes.length - 8, true)
ascii(8, 'WAVE')
ascii(12, 'fmt ')
view.setUint32(16, 16, true)
view.setUint16(20, 1, true)
view.setUint16(22, channels, true)
view.setUint32(24, sampleRate, true)
view.setUint32(28, sampleRate * channels * 2, true)
view.setUint16(32, channels * 2, true)
view.setUint16(34, 16, true)
ascii(36, 'data')
view.setUint32(40, samples.length * channels * 2, true)
for (let i = 0; i < samples.length; i++) {
  if (!Number.isFinite(samples[i]) || Math.abs(samples[i]) > 1) {
    throw new Error(`Original sample ${i} cannot be encoded without clipping`)
  }
  const pcm = Math.round(samples[i] * 32767)
  view.setInt16(44 + i * 4, pcm, true)
  view.setInt16(46 + i * 4, pcm, true)
}
if (!Deno.args.includes('--check')) await Deno.writeFile(output, bytes)
const actual = await Deno.readFile(output)
if (
  actual.length !== bytes.length ||
  actual.some((value, i) => value !== bytes[i])
) {
  throw new Error(
    'Original WAV differs from a direct PCM16 export of renderSound',
  )
}
const actualView = new DataView(
  actual.buffer,
  actual.byteOffset,
  actual.byteLength,
)
let maximumError = 0
let maximumStandardDecodeError = 0
for (let i = 0; i < samples.length; i++) {
  const left = actualView.getInt16(44 + i * 4, true)
  const right = actualView.getInt16(46 + i * 4, true)
  if (left !== right) throw new Error(`Dual-mono sample ${i} differs`)
  maximumError = Math.max(maximumError, Math.abs(left / 32767 - samples[i]))
  maximumStandardDecodeError = Math.max(
    maximumStandardDecodeError,
    Math.abs(left / 32768 - samples[i]),
  )
}
if (maximumError > tolerance || maximumStandardDecodeError > tolerance) {
  throw new Error('PCM16 quantization tolerance exceeded')
}
if (samples.length !== 25_578) {
  throw new Error('Original duration changed from 0.58s')
}
const float32Bytes = new Uint8Array(samples.length * 4)
const float32View = new DataView(float32Bytes.buffer)
for (let i = 0; i < samples.length; i++) {
  float32View.setFloat32(i * 4, samples[i], true)
}
const hash = await crypto.subtle.digest('SHA-256', float32Bytes)
const float32Hash = Array.from(
  new Uint8Array(hash),
  (value) => value.toString(16).padStart(2, '0'),
).join('')
console.log(JSON.stringify({
  source: 'v2/web/src/lib/sound.ts',
  invocation: "renderSound('achievement', 44100)",
  rendered_float32_sha256: float32Hash,
  sample_count_per_channel: samples.length,
  duration_seconds: samples.length / sampleRate,
  dual_mono_exact: true,
  original_pcm16_bytes_exact: true,
  maximum_float32_quantization_error: maximumError,
  maximum_standard_pcm_decode_error: maximumStandardDecodeError,
  permitted_quantization_error: tolerance,
  additional_normalization_or_envelope: false,
}))
