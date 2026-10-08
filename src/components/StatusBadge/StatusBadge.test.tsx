import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { DisplayStatus } from '../../types/HealthStatus'
import { StatusBadge } from './StatusBadge'

describe('StatusBadge', () => {
  it.each<[DisplayStatus, string]>([
    ['NORMAL', 'Normal'],
    ['OBSERVED', 'En observación'],
    ['ALERT', 'Alerta'],
    ['CRITICAL', 'Crítico'],
    ['UNKNOWN', 'Sin datos'],
  ])('shows %s with its Spanish label and an icon', (status, label) => {
    const { container } = render(<StatusBadge status={status} />)

    // never color alone: text + icon
    expect(screen.getByText(label)).toBeInTheDocument()
    expect(container.querySelector('svg')).toBeInTheDocument()
    expect(container.firstElementChild).toHaveAttribute('data-status', status)
  })

  it('keeps the icon out of the accessible name', () => {
    const { container } = render(<StatusBadge status="ALERT" />)

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
})
