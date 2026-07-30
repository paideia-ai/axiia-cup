// Faithful HTTP against a running `axiia serve`, shared by the e2e seed step and
// the dev seeder. Nothing here bypasses the API; the only out-of-band step either
// caller takes is `axiia admin mint` (possession-of-db is root).

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

function base32Decode(input: string): Uint8Array<ArrayBuffer> {
  const clean = input.replace(/=+$/, '').toUpperCase()
  let bits = 0
  let value = 0
  const out: number[] = []
  for (const char of clean) {
    const index = BASE32.indexOf(char)
    if (index < 0) continue
    value = (value << 5) | index
    bits += 5
    if (bits >= 8) {
      bits -= 8
      out.push((value >> bits) & 0xff)
    }
  }
  const bytes = new Uint8Array(new ArrayBuffer(out.length))
  bytes.set(out)
  return bytes
}

export async function totp(
  secret: string,
  atUnix = Math.floor(Date.now() / 1000),
) {
  const counter = Math.floor(atUnix / 30)
  const message = new Uint8Array(new ArrayBuffer(8))
  let n = counter
  for (let i = 7; i >= 0; i--) {
    message[i] = n & 0xff
    n = Math.floor(n / 256)
  }
  const key = await crypto.subtle.importKey(
    'raw',
    base32Decode(secret),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  )
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, message))
  const offset = mac[mac.length - 1] & 0x0f
  const binary = ((mac[offset] & 0x7f) << 24) |
    (mac[offset + 1] << 16) |
    (mac[offset + 2] << 8) |
    mac[offset + 3]
  return String(binary % 1_000_000).padStart(6, '0')
}

export class HttpError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

// One cookie jar per logical user. Sec-Fetch-Site: same-origin is stamped by hand
// so the server's CSRF gate accepts cookie-credentialed mutations from a
// non-browser client.
export class Session {
  readonly baseURL: string
  private readonly jar = new Map<string, string>()

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private capture(response: Response) {
    for (const [name, value] of response.headers) {
      if (name.toLowerCase() !== 'set-cookie') continue
      const head = value.split(';')[0]
      const eq = head.indexOf('=')
      if (eq < 0) continue
      const key = head.slice(0, eq)
      const val = head.slice(eq + 1)
      if (val) this.jar.set(key, val)
      else this.jar.delete(key)
    }
  }

  async call<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { 'Sec-Fetch-Site': 'same-origin' }
    if (this.jar.size) {
      headers['Cookie'] = [...this.jar.entries()]
        .map(([key, value]) => `${key}=${value}`)
        .join('; ')
    }
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    const response = await fetch(`${this.baseURL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    this.capture(response)
    const text = await response.text()
    if (!response.ok) {
      throw new HttpError(
        `${method} ${path} → ${response.status}: ${text}`,
        response.status,
      )
    }
    return (text ? JSON.parse(text) : {}) as T
  }
}

export async function adminSession(
  baseURL: string,
  email: string,
  password: string,
  totpSecret: string,
): Promise<Session> {
  const session = new Session(baseURL)
  await session.call('POST', '/v1/auth/login', { email, password })
  await session.call('POST', '/v1/auth/elevate', {
    code: await totp(totpSecret),
  })
  return session
}
