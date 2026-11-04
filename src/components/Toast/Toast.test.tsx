import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from './ToastProvider'
import { useToast } from './useToast'

function Trigger({ message }: { message: string }) {
  const toast = useToast()
  return (
    <button type="button" onClick={() => toast.show({ message })}>
      {'show'}
    </button>
  )
}

function renderWithToasts(message = 'Jaula creada') {
  render(
    <ToastProvider>
      <Trigger message={message} />
    </ToastProvider>,
  )
}

describe('Toast', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('announces the message politely and closes with its button', async () => {
    const user = userEvent.setup()
    renderWithToasts()

    await user.click(screen.getByRole('button', { name: 'show' }))
    expect(screen.getByRole('status')).toHaveTextContent('Jaula creada')

    await user.click(screen.getByRole('button', { name: 'Cerrar' }))
    await waitFor(() => expect(screen.getByRole('status')).not.toHaveTextContent('Jaula creada'))
  })

  it('leaves by itself after a few seconds', () => {
    vi.useFakeTimers()
    renderWithToasts()

    act(() => screen.getByRole('button', { name: 'show' }).click())
    expect(screen.getByText('Jaula creada')).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(5000))
    expect(screen.queryByText('Jaula creada')).not.toBeInTheDocument()
  })

  it('does nothing without a provider', async () => {
    const user = userEvent.setup()
    render(<Trigger message="nadie lo ve" />)

    await user.click(screen.getByRole('button', { name: 'show' }))
    expect(screen.queryByText('nadie lo ve')).not.toBeInTheDocument()
  })
})
