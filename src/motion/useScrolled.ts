import { useEffect, useState } from 'react'

// True once the page is scrolled past a few pixels: the header uses it to get compact and lifted.
export function useScrolled(threshold = 8): boolean {
  const [scrolled, setScrolled] = useState(() => globalThis.scrollY > threshold)

  useEffect(() => {
    const onScroll = () => setScrolled(globalThis.scrollY > threshold)
    addEventListener('scroll', onScroll, { passive: true })
    return () => removeEventListener('scroll', onScroll)
  }, [threshold])

  return scrolled
}
