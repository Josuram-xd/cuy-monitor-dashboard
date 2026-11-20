// Shrinks the photo of a cuy in the browser before it is sent: the backend takes at most 300 KB
// (contract 3.3), and a phone photo is several MB. JPEG, at most 1024 px on its long side.
export const MAX_PHOTO_BYTES = 300 * 1024
const MAX_SIDE = 1024
const QUALITIES = [0.85, 0.75, 0.65, 0.55, 0.45]

export interface PreparedPhoto {
  // base64 without the "data:" prefix, what the backend asks for
  base64: string
  contentType: 'image/jpeg'
  // for the preview
  dataUrl: string
}

export type PhotoProblemReason = 'type' | 'heic' | 'unreadable' | 'tooBig'

export class PhotoProblem extends Error {
  readonly reason: PhotoProblemReason

  constructor(reason: PhotoProblemReason) {
    super(reason)
    this.reason = reason
  }
}

function base64Bytes(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1)
  return Math.floor((base64.length * 3) / 4)
}

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new PhotoProblem('unreadable'))
    }
    image.src = url
  })
}

// HEIC is what an iPhone saves; most browsers outside Safari cannot open it
function isHeic(file: File): boolean {
  return /hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name)
}

// What is sent is always a new JPEG drawn on a canvas, so any picture the browser can open will do
// (GIF, AVIF, BMP, or a file the system gave no type). Not SVG: it can carry a script, and an
// image the browser cannot open is told apart from one that is not an image at all.
export async function preparePhoto(file: File): Promise<PreparedPhoto> {
  const notAnImage = file.type !== '' && !file.type.startsWith('image/')
  if (notAnImage || file.type === 'image/svg+xml') {
    throw new PhotoProblem('type')
  }
  let image: HTMLImageElement
  try {
    image = await loadImage(file)
  } catch (failure) {
    throw isHeic(file) ? new PhotoProblem('heic') : failure
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(image.naturalWidth, image.naturalHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
  const context = canvas.getContext('2d')
  if (!context) {
    throw new PhotoProblem('unreadable')
  }
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  for (const quality of QUALITIES) {
    const dataUrl = canvas.toDataURL('image/jpeg', quality)
    if (base64Bytes(dataUrl) <= MAX_PHOTO_BYTES) {
      return { base64: dataUrl.slice(dataUrl.indexOf(',') + 1), contentType: 'image/jpeg', dataUrl }
    }
  }
  throw new PhotoProblem('tooBig')
}
