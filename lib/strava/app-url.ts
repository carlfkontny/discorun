function isLocalhost(value: string) {
  try {
    const host = new URL(value.includes('://') ? value : `http://${value}`).hostname
    return host === 'localhost' || host === '127.0.0.1'
  } catch {
    return value.includes('localhost') || value.includes('127.0.0.1')
  }
}

function trimOrigin(value: string) {
  return value.replace(/\/$/, '')
}

export function originFromRequest(request: Request) {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto')
  if (forwardedHost) {
    const host = forwardedHost.split(',')[0]?.trim()
    const proto = forwardedProto?.split(',')[0]?.trim() || 'https'
    if (host) {
      return `${proto}://${host}`
    }
  }

  return new URL(request.url).origin
}

export function getAppUrl(request?: Request) {
  if (request) {
    const requestOrigin = originFromRequest(request)
    if (!isLocalhost(requestOrigin) || !process.env.VERCEL) {
      return requestOrigin
    }
  }

  if (process.env.VERCEL_URL && !isLocalhost(process.env.VERCEL_URL)) {
    return `https://${process.env.VERCEL_URL}`
  }

  const publicUrl = process.env.NEXT_PUBLIC_APP_URL
  if (publicUrl && !isLocalhost(publicUrl)) {
    return trimOrigin(publicUrl)
  }

  const redirectUri = process.env.STRAVA_REDIRECT_URI
  if (redirectUri && !isLocalhost(redirectUri)) {
    return new URL(redirectUri).origin
  }

  if (request) {
    return originFromRequest(request)
  }

  return publicUrl ? trimOrigin(publicUrl) : 'http://localhost:3000'
}

export function getStravaRedirectUri(request?: Request) {
  const origin = getAppUrl(request)
  return `${origin}/api/strava/callback`
}
