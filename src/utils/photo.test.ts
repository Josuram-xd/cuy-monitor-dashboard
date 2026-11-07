import { afterEach, describe, expect, it, vi } from 'vitest'
import { MAX_PHOTO_BYTES, PhotoProblem, preparePhoto } from './photo'

// jsdom has no image decoding or canvas: both are replaced by small fakes
function fakeImage(width: number, height: number) {
  vi.stubGlobal(
    'Image',
    class {
      naturalWidth = width
      naturalHeight = height
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      set src(_: string) {
        queueMicrotask(() => this.onload?.())
      }
    },
  )
  URL.createObjectURL = vi.fn(() => 'blob:photo')
  URL.revokeObjectURL = vi.fn()
}

function fakeCanvas(bytesAtQuality: (quality: number) => number) {
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ({ drawImage: vi.fn() }),
    toDataURL: (_type: string, quality: number) =>
      'data:image/jpeg;base64,' + 'A'.repeat(Math.ceil((bytesAtQuality(quality) * 4) / 3)),
  }
  const original = document.createElement.bind(document)
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) =>
    tag === 'canvas' ? (canvas as unknown as HTMLCanvasElement) : original(tag),
  )
  return canvas
}

const jpeg = new File(['x'], 'cuy.jpg', { type: 'image/jpeg' })

describe('preparePhoto', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('refuses what is not a JPG, PNG or WebP', async () => {
    await expect(
      preparePhoto(new File(['<svg/>'], 'a.svg', { type: 'image/svg+xml' })),
    ).rejects.toEqual(new PhotoProblem('type'))
  })

  it('makes a big phone photo at most 1024 px and under 300 KB, as JPEG', async () => {
    fakeImage(4000, 3000)
    const canvas = fakeCanvas((quality) => (quality > 0.7 ? 500 * 1024 : 200 * 1024))

    const photo = await preparePhoto(jpeg)

    expect([canvas.width, canvas.height]).toEqual([1024, 768])
    expect(photo.contentType).toBe('image/jpeg')
    expect(photo.dataUrl.startsWith('data:image/jpeg;base64,')).toBe(true)
    expect(photo.base64).not.toContain(',')
    expect(Math.floor((photo.base64.length * 3) / 4)).toBeLessThanOrEqual(MAX_PHOTO_BYTES)
  })

  it('keeps a small photo at its size', async () => {
    fakeImage(300, 200)
    const canvas = fakeCanvas(() => 20 * 1024)

    await preparePhoto(jpeg)

    expect([canvas.width, canvas.height]).toEqual([300, 200])
  })

  it('gives up when not even the lowest quality fits', async () => {
    fakeImage(1024, 1024)
    fakeCanvas(() => 400 * 1024)

    await expect(preparePhoto(jpeg)).rejects.toEqual(new PhotoProblem('tooBig'))
  })
})
