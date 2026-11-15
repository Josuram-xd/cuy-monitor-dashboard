import { describe, expect, it } from 'vitest'
import { createMockApi } from './createMockApi'
import { MockDatabase } from './MockDatabase'

describe('MockGuineaPigApi photo', () => {
  const api = () => createMockApi(new MockDatabase(), 0).guineaPigs

  it('replaces and removes the photo of a guinea pig', async () => {
    const guineaPigs = api()
    await guineaPigs.setPhoto('cage-1', 1, { photo: 'AQID', photoContentType: 'image/png' })
    expect((await guineaPigs.list('cage-1')).find((g) => g.id === 1)?.photoUrl).toBe(
      'data:image/png;base64,AQID',
    )
    await guineaPigs.removePhoto('cage-1', 1)
    expect((await guineaPigs.list('cage-1')).find((g) => g.id === 1)?.photoUrl).toBeNull()
  })

  it('rejects an invalid image and an unknown guinea pig', async () => {
    const guineaPigs = api()
    await expect(
      guineaPigs.setPhoto('cage-1', 1, { photo: 'AQID', photoContentType: 'image/gif' as never }),
    ).rejects.toMatchObject({ status: 400 })
    await expect(
      guineaPigs.setPhoto('cage-1', 999, { photo: 'AQID', photoContentType: 'image/png' }),
    ).rejects.toMatchObject({ status: 404 })
    await expect(guineaPigs.removePhoto('cage-1', 999)).rejects.toMatchObject({ status: 404 })
  })
})
