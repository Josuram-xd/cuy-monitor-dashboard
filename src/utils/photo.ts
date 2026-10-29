// The photo replaces the name of a cuy. The backend (and the CHECK of the database) accept at most
// 300 KB and only these three types, so the page shrinks the picture before sending it: a phone photo
// is several MB and nobody is going to resize it by hand.
export const MAX_PHOTO_BYTES = 307_200
export const MAX_PHOTO_SIDE = 512
export const PHOTO_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp']
// tried in order until the result fits; 0.8 already looks fine at 512 px
const QUALITIES = [0.8, 0.6, 0.45, 0.3]

export interface Photo {
  // what the img tag of the preview uses
  dataUrl: string
  // what travels to the backend
  base64: string
  contentType: string
}

// the biggest size that fits in a max by max box, keeping the proportions; never grows a small photo
export function fitInside(
  width: number,
  height: number,
  max: number,
): { width: number; height: number } {
  const longest = Math.max(width, height)
  if (longest <= max) {
    return { width, height }
  }
  const scale = max / longest
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

// how many bytes the backend will store, without decoding: 4 base64 characters are 3 bytes
export function base64Bytes(base64: string): number {
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0
  return Math.floor((base64.length * 3) / 4) - padding
}

export function splitDataUrl(dataUrl: string): Photo {
  const comma = dataUrl.indexOf(',')
  const contentType = dataUrl.slice(5, dataUrl.indexOf(';'))
  return { dataUrl, base64: dataUrl.slice(comma + 1), contentType }
}

function drawToCanvas(image: HTMLImageElement): HTMLCanvasElement {
  const size = fitInside(image.naturalWidth, image.naturalHeight, MAX_PHOTO_SIDE)
  const canvas = document.createElement('canvas')
  canvas.width = size.width
  canvas.height = size.height
  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('canvas is not available')
  }
  context.drawImage(image, 0, 0, size.width, size.height)
  return canvas
}

function load(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('the file is not an image'))
    }
    image.src = url
  })
}

/**
 * Turns whatever the person picked into a photo the backend accepts: at most 512 px on its longest
 * side and under 300 KB, always as JPEG (a photo of a cuy has no transparency to keep).
 */
export async function shrinkToPhoto(file: File): Promise<Photo> {
  const canvas = drawToCanvas(await load(file))
  for (const quality of QUALITIES) {
    const photo = splitDataUrl(canvas.toDataURL('image/jpeg', quality))
    if (base64Bytes(photo.base64) <= MAX_PHOTO_BYTES) {
      return photo
    }
  }
  throw new Error('the photo is too big')
}
