import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { OtpInput } from './OtpInput'

function ControlledOtp({
  onComplete,
  error,
}: {
  onComplete?: (code: string) => void
  error?: string
}) {
  const [value, setValue] = useState('')
  return <OtpInput value={value} onChange={setValue} onComplete={onComplete} error={error} />
}

function codeInput() {
  return screen.getByRole('textbox', { name: 'Código de verificación, 6 dígitos' })
}

describe('OtpInput', () => {
  it('is one labeled input that phones can autofill', () => {
    render(<ControlledOtp />)

    expect(screen.getAllByRole('textbox')).toHaveLength(1)
    expect(codeInput()).toHaveAttribute('autocomplete', 'one-time-code')
    expect(codeInput()).toHaveAttribute('inputmode', 'numeric')
  })

  it('keeps only digits', async () => {
    render(<ControlledOtp />)

    await userEvent.type(codeInput(), '4a8-1')

    expect(codeInput()).toHaveValue('481')
  })

  it('calls onComplete once when the sixth digit is typed', async () => {
    const onComplete = vi.fn()
    render(<ControlledOtp onComplete={onComplete} />)

    await userEvent.type(codeInput(), '12345')
    expect(onComplete).not.toHaveBeenCalled()
    await userEvent.type(codeInput(), '6')

    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(onComplete).toHaveBeenCalledWith('123456')
  })

  it('accepts the whole code pasted at once', async () => {
    const onComplete = vi.fn()
    render(<ControlledOtp onComplete={onComplete} />)

    await userEvent.click(codeInput())
    await userEvent.paste('654321')

    expect(onComplete).toHaveBeenCalledWith('654321')
  })

  it('links the error to the input', () => {
    render(<ControlledOtp error="El código no es correcto." />)

    expect(codeInput()).toHaveAttribute('aria-invalid', 'true')
    expect(codeInput()).toHaveAccessibleDescription('El código no es correcto.')
  })
})
