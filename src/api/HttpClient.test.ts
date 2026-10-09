import { describe, expect, it, vi } from 'vitest'
import { ApiError } from './ApiError'
import { HttpClient, type FetchFn } from './HttpClient'

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function clientAnswering(response: Response | Error) {
  const fetchFn = vi.fn<FetchFn>(() =>
    response instanceof Error ? Promise.reject(response) : Promise.resolve(response),
  )
  return { client: new HttpClient('', { fetchFn }), fetchFn }
}

describe('HttpClient', () => {
  it('returns the parsed JSON body', async () => {
    const { client } = clientAnswering(jsonResponse(200, { cageId: 'cage-1' }))

    await expect(client.get('/api/v1/cages/cage-1/health')).resolves.toEqual({ cageId: 'cage-1' })
  })

  it('prefixes the base URL', async () => {
    const fetchFn = vi.fn<FetchFn>(() => Promise.resolve(jsonResponse(200, [])))
    const client = new HttpClient('https://api.example.com', { fetchFn })

    await client.get('/api/v1/alerts')

    expect(fetchFn).toHaveBeenCalledWith('https://api.example.com/api/v1/alerts', expect.anything())
  })

  it('adds query params and skips empty ones', async () => {
    const { client, fetchFn } = clientAnswering(jsonResponse(200, []))

    await client.get('/api/v1/alerts', { query: { status: 'OPEN', from: undefined, to: '' } })

    expect(fetchFn).toHaveBeenCalledWith('/api/v1/alerts?status=OPEN', expect.anything())
  })

  it('sends the body as JSON', async () => {
    const { client, fetchFn } = clientAnswering(jsonResponse(200, {}))

    await client.patch('/api/v1/alerts/7', { status: 'REVIEWED' })

    expect(fetchFn).toHaveBeenCalledWith(
      '/api/v1/alerts/7',
      expect.objectContaining({
        method: 'PATCH',
        body: '{"status":"REVIEWED"}',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    )
  })

  it('returns undefined on 204', async () => {
    const { client } = clientAnswering(new Response(null, { status: 204 }))

    await expect(client.delete('/api/v1/account')).resolves.toBeUndefined()
  })

  it('turns the backend error body into an ApiError', async () => {
    const { client } = clientAnswering(
      jsonResponse(409, { error: 'conflict', message: 'color already used' }),
    )

    const error = await client.post('/api/v1/cages/cage-1/guinea-pigs', {}).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 409, code: 'conflict', isClientError: true })
  })

  it('uses unknown_error when the error body is not JSON', async () => {
    const { client } = clientAnswering(new Response('Bad Gateway', { status: 502 }))

    await expect(client.get('/api/v1/alerts')).rejects.toMatchObject({
      status: 502,
      code: 'unknown_error',
      isClientError: false,
    })
  })

  it('uses network_error when the request never reaches the server', async () => {
    const { client } = clientAnswering(new TypeError('Failed to fetch'))

    await expect(client.get('/api/v1/alerts')).rejects.toMatchObject({
      code: 'network_error',
      isNetworkError: true,
    })
  })
})

describe('HttpClient session cookies', () => {
  const profile = { username: 'juan', fullName: 'Juan' }
  const unauthorized = () =>
    jsonResponse(401, { error: 'unauthorized', message: 'missing, invalid or expired token' })

  // answers by "METHOD path" in order, like a tiny fake backend
  function backend(script: Record<string, Array<Response | Error>>) {
    const queues = Object.fromEntries(Object.entries(script).map(([k, v]) => [k, [...v]]))
    const fetchFn = vi.fn<FetchFn>((input, init) => {
      const key = `${init?.method ?? 'GET'} ${input}`
      const next = queues[key]?.shift()
      if (!next) {
        return Promise.reject(new Error(`unexpected call ${key}`))
      }
      return next instanceof Error ? Promise.reject(next) : Promise.resolve(next)
    })
    return fetchFn
  }

  it('sends the cookies and never an Authorization header', async () => {
    const fetchFn = backend({ 'GET /api/v1/account/profile': [jsonResponse(200, profile)] })
    const client = new HttpClient('', { fetchFn })

    await client.get('/api/v1/account/profile')

    const init = fetchFn.mock.calls[0][1]
    expect(init?.credentials).toBe('include')
    expect(init?.headers).not.toHaveProperty('Authorization')
  })

  it('renews the session once and repeats the call that got 401', async () => {
    const fetchFn = backend({
      'GET /api/v1/alerts': [unauthorized(), jsonResponse(200, [])],
      'POST /api/v1/auth/refresh': [new Response(null, { status: 204 })],
    })
    const onUnauthorized = vi.fn()
    const client = new HttpClient('', { fetchFn, onUnauthorized })

    await expect(client.get('/api/v1/alerts')).resolves.toEqual([])

    expect(fetchFn.mock.calls.map(([url, init]) => `${init?.method} ${url}`)).toEqual([
      'GET /api/v1/alerts',
      'POST /api/v1/auth/refresh',
      'GET /api/v1/alerts',
    ])
    expect(onUnauthorized).not.toHaveBeenCalled()
  })

  it('ends the session when it cannot be renewed', async () => {
    const fetchFn = backend({
      'GET /api/v1/alerts': [unauthorized()],
      'POST /api/v1/auth/refresh': [
        jsonResponse(401, { error: 'unauthorized', message: 'invalid or expired session' }),
      ],
    })
    const onUnauthorized = vi.fn()
    const client = new HttpClient('', { fetchFn, onUnauthorized })

    await expect(client.get('/api/v1/alerts')).rejects.toMatchObject({ status: 401 })

    expect(onUnauthorized).toHaveBeenCalledTimes(1)
    expect(onUnauthorized.mock.calls[0][0]).toMatchObject({
      message: 'missing, invalid or expired token',
    })
  })

  it('does not loop: a second 401 after a good refresh ends the session', async () => {
    const fetchFn = backend({
      'GET /api/v1/alerts': [unauthorized(), unauthorized()],
      'POST /api/v1/auth/refresh': [new Response(null, { status: 204 })],
    })
    const onUnauthorized = vi.fn()
    const client = new HttpClient('', { fetchFn, onUnauthorized })

    await expect(client.get('/api/v1/alerts')).rejects.toMatchObject({ status: 401 })

    expect(onUnauthorized).toHaveBeenCalledTimes(1)
    expect(fetchFn).toHaveBeenCalledTimes(3)
  })

  it('lets calls that fail together share one refresh', async () => {
    const fetchFn = backend({
      'GET /api/v1/alerts': [unauthorized(), jsonResponse(200, [])],
      'GET /api/v1/cages/cage-1/health': [unauthorized(), jsonResponse(200, { ok: true })],
      'POST /api/v1/auth/refresh': [new Response(null, { status: 204 })],
    })
    const client = new HttpClient('', { fetchFn })

    await Promise.all([client.get('/api/v1/alerts'), client.get('/api/v1/cages/cage-1/health')])

    const refreshes = fetchFn.mock.calls.filter(([url]) => url === '/api/v1/auth/refresh')
    expect(refreshes).toHaveLength(1)
  })

  it('does not end the session when the current password is wrong', async () => {
    const fetchFn = backend({
      'PUT /api/v1/account/password': [
        jsonResponse(401, { error: 'unauthorized', message: 'invalid credentials' }),
      ],
    })
    const onUnauthorized = vi.fn()
    const client = new HttpClient('', { fetchFn, onUnauthorized })

    await expect(client.put('/api/v1/account/password', {})).rejects.toMatchObject({ status: 401 })

    // no refresh attempt and no logout: the user just typed the wrong password
    expect(fetchFn).toHaveBeenCalledTimes(1)
    expect(onUnauthorized).not.toHaveBeenCalled()
  })

  it('does not refresh on /api/v1/auth/*: there a 401 is just a wrong password', async () => {
    const fetchFn = backend({
      'POST /api/v1/auth/login': [unauthorized()],
    })
    const onUnauthorized = vi.fn()
    const client = new HttpClient('', { fetchFn, onUnauthorized })

    await expect(client.post('/api/v1/auth/login', {})).rejects.toMatchObject({ status: 401 })

    expect(fetchFn).toHaveBeenCalledTimes(1)
    expect(onUnauthorized).not.toHaveBeenCalled()
  })

  it('keeps the session when the refresh fails because of the network', async () => {
    const fetchFn = backend({
      'GET /api/v1/alerts': [unauthorized()],
      'POST /api/v1/auth/refresh': [new TypeError('offline')],
    })
    const onUnauthorized = vi.fn()
    const client = new HttpClient('', { fetchFn, onUnauthorized })

    await expect(client.get('/api/v1/alerts')).rejects.toMatchObject({ code: 'network_error' })

    expect(onUnauthorized).not.toHaveBeenCalled()
  })

  it('keeps the session when the refresh fails with a server error', async () => {
    const fetchFn = backend({
      'GET /api/v1/alerts': [unauthorized()],
      'POST /api/v1/auth/refresh': [new Response('Bad Gateway', { status: 502 })],
    })
    const onUnauthorized = vi.fn()
    const client = new HttpClient('', { fetchFn, onUnauthorized })

    await expect(client.get('/api/v1/alerts')).rejects.toMatchObject({ status: 502 })

    expect(onUnauthorized).not.toHaveBeenCalled()
  })
})
