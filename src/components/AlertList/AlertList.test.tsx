import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Alert } from '../../types/Alert'
import type { GuineaPig } from '../../types/GuineaPig'
import { AlertList } from './AlertList'

const NOW = Date.parse('2026-10-05T14:32:00Z')

const chispa: GuineaPig = {
  id: 4,
  photoUrl: null,
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
    message: 'Lleva mucho más tiempo quieta de lo normal',
    status: 'OPEN',
    createdAt: new Date(NOW - 5 * 60_000).toISOString(),
    reviewedAt: null,
    aiNote: null,
    aiNoteAt: null,
    ...overrides,
  }
}

describe('AlertList', () => {
  it('shows level, guinea pig, message and how long ago', () => {
    render(<AlertList alerts={[alert({})]} guineaPigs={[chispa]} now={NOW} />)

    expect(screen.getByText('Alerta')).toBeInTheDocument()
    expect(screen.getByText('Cuy Naranja')).toBeInTheDocument()
    // the mark is a dot next to the name, named for screen readers
    expect(screen.getByRole('img', { name: 'Naranja' })).toBeInTheDocument()
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

  it('shows what the assistant wrote about the alert', () => {
    render(
      <AlertList
        alerts={[alert({ aiNote: 'Revisa si come y si bebe agua.', aiNoteAt: '2026-10-05T14:20:04Z' })]}
        guineaPigs={[chispa]}
        now={NOW}
      />,
    )

    expect(screen.getByText('Revisa si come y si bebe agua.')).toBeInTheDocument()
    expect(screen.getByText('Qué dice Cuchi')).toBeInTheDocument()
  })

  it('shows the alert without a note while the assistant has not written one', () => {
    render(<AlertList alerts={[alert({ aiNote: null, aiNoteAt: null })]} guineaPigs={[chispa]} now={NOW} />)

    // the alert itself is still there: a model that is off must not hide it
    expect(screen.getByText('Lleva mucho más tiempo quieta de lo normal')).toBeInTheDocument()
    expect(screen.queryByText('Qué dice Cuchi')).not.toBeInTheDocument()
  })
})
