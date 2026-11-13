import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useTilt } from './useTilt'

function askForLessMotion(reduce: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('prefers-reduced-motion') && reduce,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
}

// jsdom has no layout: the element is given a box of its own
function card(): HTMLElement {
  const element = document.createElement('div')
  element.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 200, height: 100 }) as DOMRect
  return element
}

function move(tilt: ReturnType<typeof useTilt>, element: HTMLElement, x: number, y: number) {
  tilt.onPointerMove({
    currentTarget: element,
    pointerType: 'mouse',
    clientX: x,
    clientY: y,
  } as unknown as React.PointerEvent<HTMLElement>)
}

afterEach(() => vi.unstubAllGlobals())

describe('useTilt', () => {
  it('leans towards the pointer, and the other way below the middle', async () => {
    askForLessMotion(false)
    const { result } = renderHook(() => useTilt())
    const element = card()

    // the bottom right corner
    move(result.current, element, 200, 100)
    await new Promise(requestAnimationFrame)

    // to the right: the right edge goes back, which is a positive rotateY
    expect(Number.parseFloat(element.style.getPropertyValue('--tilt-y'))).toBeGreaterThan(0)
    // below the middle: the bottom edge comes forward, which is a negative rotateX
    expect(Number.parseFloat(element.style.getPropertyValue('--tilt-x'))).toBeLessThan(0)
  })

  it('goes back to flat when the pointer leaves', async () => {
    askForLessMotion(false)
    const { result } = renderHook(() => useTilt())
    const element = card()
    move(result.current, element, 200, 100)
    await new Promise(requestAnimationFrame)

    result.current.onPointerLeave({ currentTarget: element } as unknown as React.PointerEvent<HTMLElement>)

    expect(element.style.getPropertyValue('--tilt-x')).toBe('')
    expect(element.style.getPropertyValue('--tilt-y')).toBe('')
  })

  it('does nothing for someone who asked the system for less motion', async () => {
    askForLessMotion(true)
    const { result } = renderHook(() => useTilt())
    const element = card()

    move(result.current, element, 200, 100)
    await new Promise(requestAnimationFrame)

    expect(element.style.getPropertyValue('--tilt-y')).toBe('')
  })

  it('does nothing for a finger: there is no hover to lean during', async () => {
    askForLessMotion(false)
    const { result } = renderHook(() => useTilt())
    const element = card()

    result.current.onPointerMove({
      currentTarget: element,
      pointerType: 'touch',
      clientX: 200,
      clientY: 100,
    } as unknown as React.PointerEvent<HTMLElement>)
    await new Promise(requestAnimationFrame)

    expect(element.style.getPropertyValue('--tilt-y')).toBe('')
  })
})
