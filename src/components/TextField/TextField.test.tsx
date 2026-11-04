import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { TextField } from './TextField'

function Field({ maxLength, error }: { maxLength?: number; error?: string }) {
  const [value, setValue] = useState('')
  return (
    <TextField
      label="Usuario"
      hint="Tu usuario"
      maxLength={maxLength}
      error={error}
      value={value}
      onChange={(event) => setValue(event.target.value)}
    />
  )
}

describe('TextField', () => {
  it('stops at maxLength and says it reached the limit', async () => {
    const user = userEvent.setup()
    render(<Field maxLength={5} />)

    await user.type(screen.getByLabelText('Usuario'), 'abcdefghij')

    expect(screen.getByLabelText('Usuario')).toHaveValue('abcde')
    expect(screen.getByText('Llegaste al máximo de 5 caracteres')).toBeInTheDocument()
    expect(screen.queryByText('Tu usuario')).not.toBeInTheDocument()
  })

  it('shows the hint again below the limit', async () => {
    const user = userEvent.setup()
    render(<Field maxLength={5} />)

    await user.type(screen.getByLabelText('Usuario'), 'abcde{Backspace}')

    expect(screen.getByText('Tu usuario')).toBeInTheDocument()
  })

  it('an error wins over the limit note', async () => {
    const user = userEvent.setup()
    render(<Field maxLength={3} error="Este dato es obligatorio." />)

    await user.type(screen.getByLabelText('Usuario'), 'abcd')

    expect(screen.getByText('Este dato es obligatorio.')).toBeInTheDocument()
    expect(screen.queryByText(/Llegaste al máximo/)).not.toBeInTheDocument()
  })
})
