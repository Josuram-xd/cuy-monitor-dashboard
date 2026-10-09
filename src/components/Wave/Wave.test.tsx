import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Wave } from './Wave'

describe('Wave', () => {
  it('is decoration', () => {
    const { container } = render(<Wave />)

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it('can take the header gradient', () => {
    const { container } = render(<Wave gradient={{ from: '#111', to: '#222' }} />)

    expect(container.querySelectorAll('stop')).toHaveLength(2)
    expect(container.querySelector('path')?.getAttribute('fill')).toMatch(/^url\(#/)
  })
})
