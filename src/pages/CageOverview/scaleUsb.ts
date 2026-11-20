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

// Iterator: yields one trimmed line at a time from a serial byte stream; a partial line waits for the next chunk
export async function* serialLines(reader: {
  read(): Promise<ReadableStreamReadResult<Uint8Array>>
}): AsyncGenerator<string> {
  const decoder = new TextDecoder()
  let pending = ''
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    const lines = (pending + decoder.decode(value, { stream: true })).split('\n')
    pending = (lines.pop() ?? '').slice(-512)
    for (const line of lines) yield line.trim()
  }
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
    let sawBytes = false
    // counts the chunks that arrived, even when they hold no full line yet
    const counted = {
      read: async () => {
        const result = await reader.read()
        if (!result.done) sawBytes = true
        return result
      },
    }
    try {
      for await (const line of serialLines(counted)) {
        const result = identifyScaleLine(line)
        if (result) return result
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
