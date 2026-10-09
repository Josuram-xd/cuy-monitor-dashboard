import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppBackdrop } from './AppBackdrop'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('AppBackdrop', () => {
  it('is decoration: hidden from assistive technology', () => {
    render(<AppBackdrop />)

    expect(screen.getByTestId('app-backdrop')).toHaveAttribute('aria-hidden', 'true')
  })

  it('moves its layers with the scroll and the mouse', () => {
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      // runs at once; 0 = no frame left pending, so the next move schedules a new one
      callback(0)
      return 0
    })
    render(<AppBackdrop />)
    const backdrop = screen.getByTestId('app-backdrop')

    // jsdom has no PointerEvent: a MouseEvent with the pointer's name carries the same coordinates
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: window.innerWidth, clientY: 0 }))

    expect(backdrop.style.getPropertyValue('--mx')).toBe('1.000')
    expect(backdrop.style.getPropertyValue('--my')).toBe('-1.000')

    Object.defineProperty(window, 'scrollY', { value: 240, configurable: true })
    fireEvent.scroll(window)
    expect(backdrop.style.getPropertyValue('--scroll')).toBe('240')
  })

  it('stays still for people who asked for no motion', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }))
    render(<AppBackdrop />)
    const backdrop = screen.getByTestId('app-backdrop')

    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 100, clientY: 100 }))

    expect(backdrop.style.getPropertyValue('--mx')).toBe('')
  })
})
