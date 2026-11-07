import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getDashboardApi } from '../../api/apiProvider'
import { createMockApi } from '../../mocks/createMockApi'
import { LiveConnectionContext, type AlertListener } from '../../realtime/LiveConnectionContext'
import { renderWithProviders } from '../../test/render'
import type { Alert } from '../../types/Alert'
import { ALERT_VISIBLE_MS, AlertToast } from './AlertToast'

vi.mock('../../api/apiProvider', () => ({ getDashboardApi: vi.fn() }))

const listeners = new Set<AlertListener>()

function renderToast() {
  return renderWithProviders(
    <LiveConnectionContext.Provider
      value={{
        status: 'connected',
        onAlert: (listener) => {
          listeners.add(listener)
          return () => listeners.delete(listener)
        },
      }}
    >
      <AlertToast />
    </LiveConnectionContext.Provider>,
  )
}

function arrive(alert: Partial<Alert>) {
  act(() =>
    listeners.forEach((listen) =>
      listen({
        id: 1,
        cageId: 'cage-1',
        guineaPigId: null,
        level: 'ALERT',
        type: 'AUDIO',
        message: 'Se escucharon chillidos de angustia en la jaula',
        status: 'OPEN',
        createdAt: '2026-11-06T10:00:00Z',
        reviewedAt: null,
        ...alert,
      }),
    ),
  )
}

describe('AlertToast', () => {
  beforeEach(() => {
    listeners.clear()
    vi.mocked(getDashboardApi).mockResolvedValue(createMockApi(undefined, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows an alert that arrives live with its level, its message, its cage and a link', async () => {
    renderToast()
    const cages = await (await getDashboardApi()).cages.list()

    arrive({ cageId: cages[0].cageId })

    const toast = screen.getByRole('alert')
    expect(within(toast).getByText('Alerta')).toBeInTheDocument()
    expect(
      within(toast).getByText('Se escucharon chillidos de angustia en la jaula'),
    ).toBeInTheDocument()
    expect(await within(toast).findByText(`en ${cages[0].name}`)).toBeInTheDocument()
    expect(
      within(toast).getByRole('link', { name: 'Ver las alertas de esta jaula' }),
    ).toHaveAttribute('href', `/alerts?cage=${cages[0].cageId}`)
  })

  it('an ALERT goes by itself, a CRITICAL one stays until it is closed', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderToast()

    arrive({ id: 1, level: 'ALERT', message: 'leve' })
    arrive({ id: 2, level: 'CRITICAL', message: 'grave' })
    act(() => {
      vi.advanceTimersByTime(ALERT_VISIBLE_MS + 100)
    })

    expect(screen.queryByText('leve')).not.toBeInTheDocument()
    expect(screen.getByText('grave')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cerrar el aviso' }))
    expect(screen.queryByText('grave')).not.toBeInTheDocument()
  })

  it('keeps at most three and does not repeat the same alert', () => {
    renderToast()

    for (const id of [1, 2, 3, 4, 4]) {
      arrive({ id, level: 'CRITICAL', message: `alerta ${id}` })
    }

    expect(screen.queryByText('alerta 1')).not.toBeInTheDocument()
    expect(screen.getAllByText(/^alerta \d$/)).toHaveLength(3)
  })
})
