import crypto from 'node:crypto'
import http from 'node:http'

const HOST = process.env.HOST ?? '0.0.0.0'
const PORT = Number(process.env.PORT ?? 3100)
const GATEWAY_SHARED_TOKEN = (process.env.GATEWAY_SHARED_TOKEN ?? '').trim()
const MAX_REQUEST_BODY_BYTES = 1024 * 1024
const UPSTREAM_TIMEOUT_MS = 180_000

class HttpError extends Error {
  constructor(statusCode, payload) {
    super(payload.error)
    this.name = 'HttpError'
    this.payload = payload
    this.statusCode = statusCode
  }
}

const PROVIDERS = {
  anthropic: {
    allowedMethods: new Set(['POST']),
    allowedPathPrefixes: ['/v1/messages'],
    baseUrl: process.env.ANTHROPIC_UPSTREAM_BASE_URL ?? 'https://api.anthropic.com',
    buildHeaders: (incomingReq) => ({
      'anthropic-version':
        typeof incomingReq.headers['anthropic-version'] === 'string'
          ? incomingReq.headers['anthropic-version']
          : process.env.ANTHROPIC_VERSION ?? '2023-06-01',
      'x-api-key': (process.env.ANTHROPIC_UPSTREAM_API_KEY ?? '').trim(),
    }),
    name: 'anthropic',
    prefix: '/anthropic/',
    upstreamApiKey: (process.env.ANTHROPIC_UPSTREAM_API_KEY ?? '').trim(),
  },
  openai: {
    allowedMethods: new Set(['POST']),
    allowedPathPrefixes: ['/v1/chat/completions'],
    baseUrl: process.env.OPENAI_UPSTREAM_BASE_URL ?? 'https://api.openai.com',
    buildHeaders: () => ({
      authorization: `Bearer ${(process.env.OPENAI_UPSTREAM_API_KEY ?? '').trim()}`,
    }),
    name: 'openai',
    prefix: '/openai/',
    upstreamApiKey: (process.env.OPENAI_UPSTREAM_API_KEY ?? '').trim(),
  },
}

validateConfig()

function validateConfig() {
  const enabledProviders = Object.values(PROVIDERS).filter(
    (provider) => provider.upstreamApiKey.length > 0,
  )

  if (enabledProviders.length > 0 && GATEWAY_SHARED_TOKEN.length === 0) {
    throw new Error(
      'GATEWAY_SHARED_TOKEN is required when any upstream provider is enabled',
    )
  }

  if (enabledProviders.length === 0) {
    console.warn('[proxy] warning: no upstream providers are enabled')
  }
}

function json(res, statusCode, payload) {
  const body = JSON.stringify(payload)
  res.writeHead(statusCode, {
    'content-length': Buffer.byteLength(body),
    'content-type': 'application/json; charset=utf-8',
  })
  res.end(body)
}

function getAuthToken(req) {
  const authorization = req.headers.authorization

  if (typeof authorization === 'string' && authorization.startsWith('Bearer ')) {
    return authorization.slice('Bearer '.length).trim()
  }

  const apiKey = req.headers['x-api-key']
  return typeof apiKey === 'string' ? apiKey.trim() : ''
}

function tokensEqual(expected, actual) {
  if (!expected || !actual) {
    return false
  }

  const expectedBuffer = Buffer.from(expected)
  const actualBuffer = Buffer.from(actual)

  return (
    expectedBuffer.length === actualBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, actualBuffer)
  )
}

function isAuthorized(req) {
  return tokensEqual(GATEWAY_SHARED_TOKEN, getAuthToken(req))
}

async function readBody(req) {
  const chunks = []
  let size = 0

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += buffer.length

    if (size > MAX_REQUEST_BODY_BYTES) {
      throw new HttpError(413, {
        error: `Request body exceeds ${MAX_REQUEST_BODY_BYTES} bytes`,
      })
    }

    chunks.push(buffer)
  }

  return Buffer.concat(chunks)
}

function stripHopByHopHeaders(headers) {
  const nextHeaders = {}

  for (const [key, value] of Object.entries(headers)) {
    if (
      value == null ||
      key === 'authorization' ||
      key === 'connection' ||
      key === 'content-length' ||
      key === 'host' ||
      key === 'keep-alive' ||
      key === 'proxy-authenticate' ||
      key === 'proxy-authorization' ||
      key === 'te' ||
      key === 'trailer' ||
      key === 'transfer-encoding' ||
      key === 'upgrade' ||
      key === 'x-api-key' ||
      key === 'x-forwarded-for' ||
      key === 'x-forwarded-host' ||
      key === 'x-forwarded-proto' ||
      key === 'x-real-ip'
    ) {
      continue
    }

    nextHeaders[key] = value
  }

  return nextHeaders
}

function buildProxyResponseHeaders(headers, body) {
  const nextHeaders = stripHopByHopHeaders(headers)

  // `fetch()` may return a decoded body while preserving upstream compression
  // headers. Forwarding those headers would make downstream clients try to
  // decompress already-decoded bytes.
  delete nextHeaders['content-encoding']
  nextHeaders['content-length'] = String(body.length)

  return nextHeaders
}

function buildUpstreamUrl(req, provider) {
  const requestUrl = new URL(req.url ?? '/', 'http://127.0.0.1')
  const strippedPath = requestUrl.pathname.slice(provider.prefix.length)
  const normalizedBase = provider.baseUrl.endsWith('/')
    ? provider.baseUrl
    : `${provider.baseUrl}/`

  return new URL(strippedPath.replace(/^\/+/, ''), normalizedBase)
}

function isAllowedUpstreamPath(upstreamUrl, provider) {
  return provider.allowedPathPrefixes.some((prefix) => {
    return (
      upstreamUrl.pathname === prefix ||
      upstreamUrl.pathname.startsWith(`${prefix}/`)
    )
  })
}

function isTimeoutError(error) {
  return error instanceof Error && error.name === 'TimeoutError'
}

async function proxyRequest(req, res, provider) {
  const startedAt = Date.now()
  const method = req.method ?? 'GET'

  try {
    if (provider.upstreamApiKey.length === 0) {
      throw new HttpError(503, {
        error: `${provider.name} upstream is not configured`,
      })
    }

    if (!provider.allowedMethods.has(method)) {
      throw new HttpError(405, {
        error: `Method ${method} is not allowed for ${provider.name}`,
      })
    }

    const upstreamUrl = buildUpstreamUrl(req, provider)

    if (!isAllowedUpstreamPath(upstreamUrl, provider)) {
      throw new HttpError(403, {
        error: `Path ${upstreamUrl.pathname} is not allowed for ${provider.name}`,
      })
    }

    const body = method === 'GET' || method === 'HEAD' ? undefined : await readBody(req)
    const headers = {
      ...stripHopByHopHeaders(req.headers),
      ...provider.buildHeaders(req),
    }

    const upstreamResponse = await fetch(upstreamUrl, {
      body,
      headers,
      method,
      redirect: 'error',
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    })
    const responseBody = Buffer.from(await upstreamResponse.arrayBuffer())
    const responseHeaders = buildProxyResponseHeaders(
      Object.fromEntries(upstreamResponse.headers.entries()),
      responseBody,
    )

    res.writeHead(upstreamResponse.status, responseHeaders)
    res.end(responseBody)

    console.log(
      `[proxy] ${provider.name} ${method} ${upstreamUrl.pathname} -> ${upstreamResponse.status} ${Date.now() - startedAt}ms`,
    )
  } catch (error) {
    if (error instanceof HttpError) {
      json(res, error.statusCode, error.payload)
      return
    }

    if (isTimeoutError(error)) {
      console.error(`[proxy] ${provider.name} upstream timeout`, error)
      json(res, 504, {
        error: `${provider.name} upstream request timed out`,
      })
      return
    }

    console.error(`[proxy] ${provider.name} upstream error`, error)
    json(res, 502, {
      error: `${provider.name} upstream request failed`,
    })
  }
}

function matchProvider(pathname) {
  return Object.values(PROVIDERS).find((provider) => pathname.startsWith(provider.prefix))
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url ?? '/', 'http://127.0.0.1')

  if (requestUrl.pathname === '/health') {
    json(res, 200, { ok: true, timestamp: new Date().toISOString() })
    return
  }

  const provider = matchProvider(requestUrl.pathname)

  if (!provider) {
    json(res, 404, { error: 'Not found' })
    return
  }

  if (!isAuthorized(req)) {
    json(res, 401, { error: 'Unauthorized' })
    return
  }

  await proxyRequest(req, res, provider)
})

server.headersTimeout = 15_000
server.requestTimeout = UPSTREAM_TIMEOUT_MS + 10_000
server.keepAliveTimeout = 5_000

server.listen(PORT, HOST, () => {
  const enabledProviders = Object.values(PROVIDERS)
    .filter((provider) => provider.upstreamApiKey.length > 0)
    .map((provider) => provider.name)

  console.log(
    `[proxy] listening on http://${HOST}:${PORT} providers=${enabledProviders.join(',') || 'none'}`,
  )
})
