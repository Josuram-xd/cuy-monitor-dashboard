import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, request } from './client'

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function mockFetch(response: Response | Error) {
  const fetchMock = vi.fn(() =>
    response instanceof Error ? Promise.reject(response) : Promise.resolve(response),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('request', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns the parsed JSON body', async () => {
    mockFetch(jsonResponse(200, { cageId: 'cage-1' }))

    await expect(request('/api/v1/cages/cage-1/health')).resolves.toEqual({ cageId: 'cage-1' })
  })

  it('adds query params and skips empty ones', async () => {
    const fetchMock = mockFetch(jsonResponse(200, []))

    await request('/api/v1/alerts', { query: { status: 'OPEN', from: undefined, to: '' } })

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/alerts?status=OPEN', expect.anything())
  })

  it('sends the body as JSON', async () => {
    const fetchMock = mockFetch(jsonResponse(200, {}))

    await request('/api/v1/alerts/7', { method: 'PATCH', body: { status: 'REVIEWED' } })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/alerts/7',
      expect.objectContaining({
        method: 'PATCH',
        body: '{"status":"REVIEWED"}',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    )
  })

  it('returns undefined on 204', async () => {
    mockFetch(new Response(null, { status: 204 }))

    await expect(request('/api/v1/users/me', { method: 'DELETE' })).resolves.toBeUndefined()
  })

  it('turns the backend error body into an ApiError', async () => {
    mockFetch(jsonResponse(409, { error: 'conflict', message: 'color already used' }))

    const error = await request('/api/v1/cages/cage-1/guinea-pigs').catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 409, code: 'conflict' })
  })

  it('uses unknown_error when the error body is not JSON', async () => {
    mockFetch(new Response('Bad Gateway', { status: 502 }))

    await expect(request('/api/v1/alerts')).rejects.toMatchObject({
      status: 502,
      code: 'unknown_error',
    })
  })

  it('uses network_error when the request never reaches the server', async () => {
    mockFetch(new TypeError('Failed to fetch'))

    await expect(request('/api/v1/alerts')).rejects.toMatchObject({
      status: 0,
      code: 'network_error',
    })
  })
})
