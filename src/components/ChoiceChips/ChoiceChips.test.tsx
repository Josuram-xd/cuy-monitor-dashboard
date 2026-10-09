import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ChoiceChips } from './ChoiceChips'

const OPTIONS = [
  { value: 'A', label: 'Uno' },
  { value: 'B', label: 'Dos' },
] as const

describe('ChoiceChips', () => {
  it('marks the chosen option and reports a new choice', async () => {
    const onChange = vi.fn()
    render(<ChoiceChips legend="Letra" options={OPTIONS} value="A" onChange={onChange} />)

    expect(screen.getByRole('button', { name: 'Uno' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Dos' })).toHaveAttribute('aria-pressed', 'false')

    await userEvent.click(screen.getByRole('button', { name: 'Dos' }))
    expect(onChange).toHaveBeenCalledWith('B')
  })

  it('clears the choice when the chosen one is pressed again', async () => {
    const onChange = vi.fn()
    render(<ChoiceChips legend="Letra" options={OPTIONS} value="A" onChange={onChange} />)

    await userEvent.click(screen.getByRole('button', { name: 'Uno' }))

    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('names the group with its legend', () => {
    render(<ChoiceChips legend="Letra" options={OPTIONS} value={null} onChange={() => {}} />)

    expect(screen.getByRole('group', { name: 'Letra' })).toBeInTheDocument()
  })
})
