import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { CageHealth, CageGuineaPigStatus } from '../../types/CageHealth'
import type { HealthStatus } from '../../types/HealthStatus'
import { CageStatusBanner } from './CageStatusBanner'

const NOW = Date.parse('2026-10-05T14:32:00Z')

function health(status: HealthStatus, pigs: HealthStatus[]): CageHealth {
  const guineaPigs: CageGuineaPigStatus[] = pigs.map((s, i) => ({
    id: i + 1,
    name: `Cuy ${i + 1}`,
    markColor: 'RED',
    status: s,
  }))
  return {
    cageId: 'cage-1',
    status,
    guineaPigs,
    audio: { status: 'NORMAL', lastEventAt: null },
    weight: { status: 'NORMAL', lastGrams: null, lastMeasuredAt: null },
    updatedAt: new Date(NOW - 2 * 60_000).toISOString(),
  }
}

describe('CageStatusBanner', () => {
  it('shows UNKNOWN and no counts without data', () => {
    render(<CageStatusBanner />)

    expect(screen.getByText('Aún no hay datos de la jaula')).toBeInTheDocument()
    expect(screen.getByText('Sin datos')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('says all is well when the cage is NORMAL', () => {
    render(<CageStatusBanner health={health('NORMAL', ['NORMAL', 'NORMAL'])} />)

    expect(screen.getByText('Todo bien en la jaula')).toBeInTheDocument()
  })

  it.each([
    [['ALERT', 'NORMAL'] as HealthStatus[], '1 cuy en alerta'],
    [['ALERT', 'ALERT', 'OBSERVED'] as HealthStatus[], '2 cuyes en alerta'],
  ])('counts the guinea pigs in the worst status', (pigs, text) => {
    render(<CageStatusBanner health={health('ALERT', pigs)} />)

    expect(screen.getByText(text)).toBeInTheDocument()
  })

  it('points at the cage when the worst status is not from a guinea pig', () => {
    render(<CageStatusBanner health={health('ALERT', ['NORMAL'])} />)

    expect(screen.getByText('Revisa la jaula')).toBeInTheDocument()
  })

  it('lists the count per status, worst first', () => {
    render(<CageStatusBanner health={health('ALERT', ['NORMAL', 'ALERT', 'NORMAL'])} />)

    const items = within(screen.getByRole('list', { name: 'Cuyes por estado' })).getAllByRole(
      'listitem',
    )
    expect(items.map((li) => li.textContent)).toEqual(['1Alerta', '2Normal'])
  })

  it('shows when it was updated if it gets the current time', () => {
    render(<CageStatusBanner health={health('NORMAL', ['NORMAL'])} now={NOW} />)

    expect(screen.getByText('Actualizado hace 2 min')).toBeInTheDocument()
  })
})
