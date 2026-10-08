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
  return { client: new HttpClient('', fetchFn), fetchFn }
}

describe('HttpClient', () => {
  it('returns the parsed JSON body', async () => {
    const { client } = clientAnswering(jsonResponse(200, { cageId: 'cage-1' }))

    await expect(client.get('/api/v1/cages/cage-1/health')).resolves.toEqual({ cageId: 'cage-1' })
  })

  it('prefixes the base URL', async () => {
    const fetchFn = vi.fn<FetchFn>(() => Promise.resolve(jsonResponse(200, [])))
    const client = new HttpClient('https://api.example.com', fetchFn)

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

    await expect(client.delete('/api/v1/users/me')).resolves.toBeUndefined()
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
