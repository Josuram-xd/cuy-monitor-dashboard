import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { SimulationStatus } from '../../types/Simulation'
import { SimulationPanel } from './SimulationPanel'

const credit = {
  title: 'Video de ejemplo de cuyes',
  author: 'Autor de ejemplo',
  license: 'CC BY 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  sourceUrl: 'https://commons.wikimedia.org/',
}

function status(overrides: Partial<SimulationStatus>): SimulationStatus {
  return {
    running: true,
    startedAt: '2026-11-20T10:00:00Z',
    framesSent: 0,
    frameCount: 180,
    credit,
    ...overrides,
  }
}

describe('SimulationPanel', () => {
  it('says the data is simulated and shows the credit with links that open in a new tab', () => {
    render(<SimulationPanel status={status({ framesSent: 300 })} />)

    expect(screen.getByText(/Los datos no son de tus cuyes/)).toBeInTheDocument()
    expect(
      screen.getByText('Video: Video de ejemplo de cuyes, de Autor de ejemplo (CC BY 4.0)', {
        exact: false,
      }),
    ).toBeInTheDocument()
    const license = screen.getByRole('link', { name: 'Ver la licencia' })
    expect(license).toHaveAttribute('href', credit.licenseUrl)
    expect(license).toHaveAttribute('target', '_blank')
    expect(license).toHaveAttribute('rel', 'noreferrer')
  })

  it('follows the progress: loading, then watching, then running', () => {
    const { rerender } = render(<SimulationPanel status={status({ framesSent: 0 })} />)
    expect(screen.getByRole('status')).toHaveTextContent('Cargando el video…')

    rerender(<SimulationPanel status={status({ framesSent: 30 })} />)
    expect(screen.getByRole('status')).toHaveTextContent('La IA está mirando el video')

    rerender(<SimulationPanel status={status({ framesSent: 120 })} />)
    expect(screen.getByRole('status')).toHaveTextContent('Simulación en marcha')
  })

  it('shows no progress when the video is not running', () => {
    render(<SimulationPanel status={status({ running: false })} />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
