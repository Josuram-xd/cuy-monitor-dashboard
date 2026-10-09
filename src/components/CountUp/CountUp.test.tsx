import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CountUp } from './CountUp'

describe('CountUp', () => {
  it('starts on its value and exposes it to assistive technology', () => {
    render(<CountUp value={4} />)

    expect(screen.getByLabelText('4')).toHaveTextContent('4')
  })

  it('ends on the new value', async () => {
    const { rerender } = render(<CountUp value={1} duration={20} />)

    rerender(<CountUp value={5} duration={20} />)

    expect(screen.getByLabelText('5')).toBeInTheDocument()
    await screen.findByText('5')
  })
})
