import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Mascot } from './Mascot'

describe('Mascot', () => {
  it('is decoration unless it is given a description', () => {
    const { container } = render(<Mascot />)

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('is announced when it has a label', () => {
    render(<Mascot mood="worried" label="Cuchi está preocupado" />)

    expect(screen.getByRole('img', { name: 'Cuchi está preocupado' })).toBeInTheDocument()
  })

  it.each(['happy', 'worried', 'alarm', 'sleepy'] as const)('draws the %s face', (mood) => {
    const { container } = render(<Mascot mood={mood} />)

    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
