const upstreamBase = process.env.API_INTERNAL_URL || 'http://localhost:4000/api/v1'

async function proxy(request: Request, context: { params: Promise<{ path: string[] }> }): Promise<Response> {
  const { path } = await context.params
  const incoming = new URL(request.url)
  if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    const origin = request.headers.get('origin')
    if (origin && origin !== incoming.origin) return new Response('Forbidden origin', { status: 403 })
  }
  const target = `${upstreamBase.replace(/\/$/, '')}/${path.map(encodeURIComponent).join('/')}${incoming.search}`
  const headers = new Headers(request.headers)
  for (const name of ['host', 'connection', 'content-length', 'accept-encoding', 'origin']) headers.delete(name)
  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
      duplex: 'half',
      cache: 'no-store',
      redirect: 'manual',
    } as RequestInit & { duplex: 'half' })
    const responseHeaders = new Headers(upstream.headers)
    for (const name of ['connection', 'content-length', 'content-encoding', 'transfer-encoding', 'set-cookie']) responseHeaders.delete(name)
    for (const cookie of upstream.headers.getSetCookie()) responseHeaders.append('set-cookie', cookie)
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders })
  } catch {
    return Response.json({ message: 'API temporarily unavailable' }, { status: 502 })
  }
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE, proxy as HEAD, proxy as OPTIONS }
