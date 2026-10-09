import { render, screen } from '@testing-library/react'
import { act } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Reveal } from './Reveal'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Reveal', () => {
  it('shows its content right away when the browser cannot observe scrolling', () => {
    render(<Reveal>hola</Reveal>)

    expect(screen.getByText('hola').className).toContain('seen')
  })

  it('waits until it is on screen and then stays visible', () => {
    let callback: IntersectionObserverCallback = () => {}
    const disconnect = vi.fn()
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb: IntersectionObserverCallback) {
          callback = cb
        }
        observe() {}
        disconnect = disconnect
      },
    )
    render(<Reveal>hola</Reveal>)
    expect(screen.getByText('hola').className).not.toContain('seen')

    act(() => callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as never))

    expect(screen.getByText('hola').className).toContain('seen')
    expect(disconnect).toHaveBeenCalled()
  })
})
