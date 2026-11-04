import { useEffect, useRef, useState } from 'react'

const COPIED_FOR_MS = 2000

// Copies a text and says "copied" for a moment. A browser without clipboard access just stays as it was:
// the text is still on screen to copy by hand.
export function useCopyToClipboard() {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), COPIED_FOR_MS)
    } catch {
      // no clipboard (old browser or no permission)
    }
  }

  return { copied, copy }
}
