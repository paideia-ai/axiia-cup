// Seeded randomness. Every draw the tournament makes (lotteries, game seeds,
// the mock) goes through a string seed, so a recorded seed replays exactly.

function cyrb128(text: string): [number, number, number, number] {
  let h1 = 1779033703
  let h2 = 3144134277
  let h3 = 1013904242
  let h4 = 2773480762
  for (let i = 0; i < text.length; i++) {
    const k = text.charCodeAt(i)
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067)
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233)
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213)
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179)
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067)
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233)
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213)
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179)
  h1 ^= h2 ^ h3 ^ h4
  h2 ^= h1
  h3 ^= h1
  h4 ^= h1
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0]
}

export type Random = () => number

// sfc32 over a cyrb128 hash of the seed: uniform in [0, 1).
export function random(seed: string): Random {
  let [a, b, c, d] = cyrb128(seed)
  return () => {
    a |= 0
    b |= 0
    c |= 0
    d |= 0
    const t = (((a + b) | 0) + d) | 0
    d = (d + 1) | 0
    a = b ^ (b >>> 9)
    b = (c + (c << 3)) | 0
    c = (c << 21) | (c >>> 11)
    c = (c + t) | 0
    return (t >>> 0) / 4294967296
  }
}

export function normal(r: Random): number {
  let u = 0
  while (u === 0) u = r()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r())
}

// Fisher–Yates with a seeded generator; the input is not modified.
export function shuffle<T>(items: readonly T[], seed: string): T[] {
  const r = random(seed)
  const out = items.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
