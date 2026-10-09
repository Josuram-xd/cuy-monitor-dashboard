import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LiveConnectionContext, type LiveStatus } from '../../realtime/LiveConnectionContext'
import { LiveIndicator } from './LiveIndicator'

const labels: Record<LiveStatus, string> = {
  connecting: 'Conectando…',
  connected: 'En vivo',
  reconnecting: 'Reconectando…',
  disconnected: 'Sin conexión en vivo — los datos pueden estar desactualizados',
}

describe('LiveIndicator', () => {
  it.each(Object.entries(labels) as [LiveStatus, string][])(
    'announces the %s state with a text label',
    (status, label) => {
      render(
        <LiveConnectionContext.Provider value={{ status }}>
          <LiveIndicator />
        </LiveConnectionContext.Provider>,
      )

      expect(screen.getByRole('status')).toHaveTextContent(label)
      expect(screen.getByRole('status')).toHaveAttribute('data-status', status)
      expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
    },
  )
})
