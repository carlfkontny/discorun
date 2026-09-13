import https from 'node:https'
import { URL } from 'node:url'

const STRAVA_USER_AGENT = 'Discorun/1.0'

function headerValue(value: string | string[] | undefined) {
  if (!value) {
    return undefined
  }
  return Array.isArray(value) ? value.join(', ') : value
}

function isRetryableNetworkError(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  const cause = 'cause' in error ? (error.cause as { code?: string } | undefined) : undefined
  const code = cause?.code ?? (error as Error & { code?: string }).code
  return (
    error.message.includes('fetch failed') ||
    code === 'ECONNRESET' ||
    code === 'ETIMEDOUT' ||
    code === 'ECONNREFUSED' ||
    code === 'UND_ERR_SOCKET'
  )
}

function nodeRequest(url: string, init: RequestInit = {}): Promise<Response> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url)
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'User-Agent': STRAVA_USER_AGENT,
    }

    if (init.headers) {
      const incoming = new Headers(init.headers)
      incoming.forEach((value, key) => {
        headers[key] = value
      })
    }

    const body =
      typeof init.body === 'string' || init.body instanceof URLSearchParams
        ? init.body.toString()
        : undefined

    if (body && !headers['Content-Type'] && !headers['content-type']) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded'
    }

    if (body) {
      headers['Content-Length'] = String(Buffer.byteLength(body))
    }

    const request = https.request(
      {
        protocol: 'https:',
        hostname: parsed.hostname,
        path: `${parsed.pathname}${parsed.search}`,
        method: init.method ?? 'GET',
        headers,
        family: 4,
        timeout: 20_000,
      },
      (response) => {
        const chunks: Buffer[] = []
        response.on('data', (chunk) => chunks.push(chunk))
        response.on('end', () => {
          const responseHeaders = new Headers()
          for (const [key, value] of Object.entries(response.headers)) {
            const normalized = headerValue(value)
            if (normalized) {
              responseHeaders.set(key, normalized)
            }
          }

          resolve(
            new Response(Buffer.concat(chunks).toString('utf8'), {
              status: response.statusCode ?? 500,
              headers: responseHeaders,
            })
          )
        })
      }
    )

    request.on('timeout', () => {
      request.destroy(new Error('Strava request timed out'))
    })
    request.on('error', reject)

    if (body) {
      request.write(body)
    }
    request.end()
  })
}

export async function stravaFetch(url: string, init: RequestInit = {}, attempts = 3) {
  let lastError: unknown

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await nodeRequest(url, init)
    } catch (error) {
      lastError = error
      if (attempt === attempts || !isRetryableNetworkError(error)) {
        throw error
      }
      await new Promise((resolve) => setTimeout(resolve, 400 * attempt))
    }
  }

  throw lastError
}
