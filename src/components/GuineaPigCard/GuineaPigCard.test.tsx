import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { BehaviorWindow, GuineaPig } from '../../types/GuineaPig'
import { GuineaPigCard } from './GuineaPigCard'

const NOW = Date.parse('2026-10-05T14:32:00Z')

const canela: GuineaPig = {
  id: 1,
  name: 'Canela',
  markColor: 'RED',
  status: 'OBSERVED',
  statusSince: '2026-10-05T14:10:00Z',
}

function windowAt(minutesAgo: number): BehaviorWindow {
  return {
    occurredAt: new Date(NOW - minutesAgo * 60_000).toISOString(),
    stillSeconds: 48,
    feederVisits: 0,
    watererVisits: 1,
    avgGroupDistance: 0.72,
  }
}

function renderCard(lastWindow?: BehaviorWindow) {
  return render(
    <MemoryRouter>
      <GuineaPigCard cageId="cage-1" guineaPig={canela} lastWindow={lastWindow} now={NOW} />
    </MemoryRouter>,
  )
}

describe('GuineaPigCard', () => {
  it('links to the guinea pig detail', () => {
    renderCard()

    expect(screen.getByRole('link')).toHaveAttribute('href', '/cages/cage-1/guinea-pigs/1')
  })

  it('shows name, mark color and status', () => {
    renderCard()

    expect(screen.getByText('Canela')).toBeInTheDocument()
    expect(screen.getByText('Rojo')).toBeInTheDocument()
    expect(screen.getByText('En observación')).toBeInTheDocument()
  })

  it('shows the behavior in plain words and when it was last seen', () => {
    renderCard(windowAt(2))

    expect(screen.getByText('Quieto 48 de los últimos 60 s')).toBeInTheDocument()
    expect(screen.getByText('Visto hace 2 min')).toBeInTheDocument()
  })

  it('shows UNKNOWN instead of its status when not seen for more than 10 minutes', () => {
    renderCard(windowAt(12))

    expect(screen.getByText('Sin datos')).toBeInTheDocument()
    expect(screen.queryByText('En observación')).not.toBeInTheDocument()
    expect(screen.getByText('No se ha visto hace 12 min')).toBeInTheDocument()
    expect(screen.queryByText(/Quieto/)).not.toBeInTheDocument()
  })

  it('keeps its status at exactly 10 minutes', () => {
    renderCard(windowAt(10))

    expect(screen.getByText('En observación')).toBeInTheDocument()
  })

  it('glows once when the status goes up, never when it goes down', () => {
    const card = (status: GuineaPig['status']) => (
      <MemoryRouter>
        <GuineaPigCard cageId="cage-1" guineaPig={{ ...canela, status }} now={NOW} />
      </MemoryRouter>
    )
    const { container, rerender } = render(card('OBSERVED'))
    const pulses = () => container.querySelectorAll('[class*="pulse"]').length
    expect(pulses()).toBe(0)

    rerender(card('ALERT'))
    expect(pulses()).toBe(1)

    rerender(card('NORMAL'))
    rerender(card('NORMAL'))
    const afterGoingDown = container.querySelector('[class*="pulse"]')
    rerender(card('NORMAL'))
    expect(container.querySelector('[class*="pulse"]')).toBe(afterGoingDown)
  })
})
