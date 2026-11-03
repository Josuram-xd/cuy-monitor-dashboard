import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CopyCodeButton } from './CopyCodeButton'

describe('CopyCodeButton', () => {
  it('copies the code and says so', async () => {
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
    render(<CopyCodeButton code="cage-0a1b2c3d" />)

    await user.click(screen.getByRole('button', { name: 'Copiar el código cage-0a1b2c3d' }))

    expect(writeText).toHaveBeenCalledWith('cage-0a1b2c3d')
    expect(await screen.findByText('¡Copiado!')).toBeInTheDocument()
  })

  it('keeps showing the code when the browser cannot copy', async () => {
    const user = userEvent.setup()
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'))
    render(<CopyCodeButton code="cage-1" />)

    await user.click(screen.getByRole('button', { name: 'Copiar el código cage-1' }))

    expect(screen.getByText('cage-1')).toBeInTheDocument()
    expect(screen.queryByText('¡Copiado!')).not.toBeInTheDocument()
  })
})
