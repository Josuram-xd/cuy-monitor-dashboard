import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { WeightField } from './WeightField'

function Harness({ initial = '' }: { initial?: string }) {
  const [value, setValue] = useState(initial)
  return <WeightField label="Peso" value={value} onChange={setValue} />
}

describe('WeightField', () => {
  it('only keeps digits', async () => {
    render(<Harness />)

    await userEvent.type(screen.getByLabelText(/Peso/), '8a5,0')

    expect(screen.getByLabelText(/Peso/)).toHaveValue('850')
  })

  it('steps by 10 g with the buttons and starts at a typical adult weight', async () => {
    render(<Harness />)

    await userEvent.click(screen.getByRole('button', { name: 'Más peso' }))
    expect(screen.getByLabelText(/Peso/)).toHaveValue('810')

    await userEvent.click(screen.getByRole('button', { name: 'Menos peso' }))
    await userEvent.click(screen.getByRole('button', { name: 'Menos peso' }))
    expect(screen.getByLabelText(/Peso/)).toHaveValue('790')
  })

  it('never goes outside the limits', async () => {
    render(<Harness initial="55" />)

    await userEvent.click(screen.getByRole('button', { name: 'Menos peso' }))

    expect(screen.getByLabelText(/Peso/)).toHaveValue('50')
  })
})
