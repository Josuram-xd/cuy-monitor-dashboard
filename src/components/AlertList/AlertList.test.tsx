import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Alert } from '../../types/Alert'
import type { GuineaPig } from '../../types/GuineaPig'
import { AlertList } from './AlertList'

const NOW = Date.parse('2026-10-05T14:32:00Z')

const chispa: GuineaPig = {
  id: 4,
  name: 'Chispa',
  markColor: 'ORANGE',
  status: 'ALERT',
  statusSince: '2026-10-05T14:00:00Z',
}

function alert(overrides: Partial<Alert>): Alert {
  return {
    id: 1,
    cageId: 'cage-1',
    guineaPigId: 4,
    level: 'ALERT',
    type: 'BEHAVIOR',
    message: 'Chispa lleva mucho más tiempo quieta de lo normal',
    status: 'OPEN',
    createdAt: new Date(NOW - 5 * 60_000).toISOString(),
    reviewedAt: null,
    ...overrides,
  }
}

describe('AlertList', () => {
  it('shows level, guinea pig, message and how long ago', () => {
    render(<AlertList alerts={[alert({})]} guineaPigs={[chispa]} now={NOW} />)

    expect(screen.getByText('Alerta')).toBeInTheDocument()
    expect(screen.getByText('Chispa')).toBeInTheDocument()
    expect(screen.getByText('Naranja')).toBeInTheDocument()
    expect(screen.getByText(/quieta de lo normal/)).toBeInTheDocument()
    expect(screen.getByText('hace 5 min')).toBeInTheDocument()
  })

  it('says "Toda la jaula" for cage-level alerts', () => {
    render(<AlertList alerts={[alert({ guineaPigId: null, type: 'AUDIO' })]} now={NOW} />)

    expect(screen.getByText('Toda la jaula')).toBeInTheDocument()
  })

  it('has no review button unless a handler is given', () => {
    render(<AlertList alerts={[alert({})]} guineaPigs={[chispa]} now={NOW} />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('marks an open alert as reviewed', async () => {
    const onMarkReviewed = vi.fn()
    const open = alert({})
    render(
      <AlertList
        alerts={[open, alert({ id: 2, status: 'REVIEWED' })]}
        guineaPigs={[chispa]}
        now={NOW}
        onMarkReviewed={onMarkReviewed}
      />,
    )

    // only the open one can be reviewed
    const buttons = screen.getAllByRole('button', { name: 'Marcar como revisada' })
    expect(buttons).toHaveLength(1)
    await userEvent.click(buttons[0])
    expect(onMarkReviewed).toHaveBeenCalledWith(open)
  })
})
