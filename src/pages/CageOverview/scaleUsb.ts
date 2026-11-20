interface ScalePort {
  open(options: { baudRate: number }): Promise<void>
  readable: ReadableStream<Uint8Array> | null
  close(): Promise<void>
}
type SerialBrowser = Navigator & { serial?: { requestPort(): Promise<ScalePort> } }

export function identifyScaleLine(line: string) {
  if (/^Lectura:\s*-?\d+$/i.test(line)) return 'raw'
  if (/^El HX711 no responde/i.test(line)) return 'sensor'
  try {
    const data = JSON.parse(line)
    if (Number.isFinite(data?.grams) && typeof data.stable === 'boolean') {
      return data.grams < 0 ? 'negative' : data.stable ? 'valid' : 'unstable'
    }
  } catch {
    /* Startup messages are plain text. */
  }
  return null
}

export async function checkScaleUsb(signal: AbortSignal) {
  const serial = (navigator as SerialBrowser).serial
  if (!serial) return 'unsupported'
  let port: ScalePort
  try {
    port = await serial.requestPort()
  } catch (error) {
    return error instanceof DOMException && error.name === 'NotFoundError' ? 'unselected' : 'denied'
  }
  if (signal.aborted) return 'unselected'
  try {
    await port.open({ baudRate: 115200 })
  } catch {
    return 'busy'
  }
  try {
    if (!port.readable || signal.aborted) return 'silent'
    const reader = port.readable.getReader()
    const cancel = () => {
      void reader.cancel().catch(() => {})
    }
    signal.addEventListener('abort', cancel)
    const timer = setTimeout(cancel, 8000)
    const decoder = new TextDecoder()
    let pending = ''
    let sawBytes = false
    try {
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        sawBytes = true
        const lines = (pending + decoder.decode(value, { stream: true })).split('\n')
        pending = (lines.pop() ?? '').slice(-512)
        for (const line of lines) {
          const result = identifyScaleLine(line.trim())
          if (result) return result
        }
      }
      return sawBytes ? 'unknown' : 'silent'
    } finally {
      clearTimeout(timer)
      signal.removeEventListener('abort', cancel)
      reader.releaseLock()
    }
  } finally {
    await port.close()
  }
}
