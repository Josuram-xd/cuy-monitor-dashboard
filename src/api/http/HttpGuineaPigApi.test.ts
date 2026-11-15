import { describe, expect, it, vi } from 'vitest'
import type { HttpClient } from '../HttpClient'
import { HttpGuineaPigApi } from './HttpGuineaPigApi'

function fakeHttp(list: unknown[] = []) {
  return {
    get: vi.fn().mockResolvedValue(list),
    put: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  } as unknown as HttpClient & Record<'get' | 'put' | 'delete', ReturnType<typeof vi.fn>>
}

describe('HttpGuineaPigApi photo', () => {
  it('puts the image and deletes it on the photo path of the guinea pig', async () => {
    const http = fakeHttp()
    const api = new HttpGuineaPigApi(http)
    const body = { photo: 'AQID', photoContentType: 'image/png' } as const

    await api.setPhoto('cage 1', 7, body)
    await api.removePhoto('cage 1', 7)

    expect(http.put).toHaveBeenCalledWith('/api/v1/cages/cage%201/guinea-pigs/7/photo', body)
    expect(http.delete).toHaveBeenCalledWith('/api/v1/cages/cage%201/guinea-pigs/7/photo')
  })

  it('stamps the address of a photo that changed, so the browser does not show the old one', async () => {
    const http = fakeHttp([
      { id: 7, photoUrl: '/api/v1/guinea-pigs/7/photo' },
      { id: 8, photoUrl: '/api/v1/guinea-pigs/8/photo' },
      { id: 9, photoUrl: null },
    ])
    const api = new HttpGuineaPigApi(http)
    expect((await api.list('c'))[0].photoUrl).toBe('/api/v1/guinea-pigs/7/photo')

    await api.setPhoto('c', 7, { photo: 'AQID', photoContentType: 'image/png' })
    await api.removePhoto('c', 9)
    const [seven, eight, nine] = await api.list('c')

    expect(seven.photoUrl).toMatch(/^\/api\/v1\/guinea-pigs\/7\/photo\?v=\d+$/)
    expect(eight.photoUrl).toBe('/api/v1/guinea-pigs/8/photo')
    expect(nine.photoUrl).toBeNull()
  })
})
