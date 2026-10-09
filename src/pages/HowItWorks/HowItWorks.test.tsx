import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { HowItWorks } from './HowItWorks'

describe('HowItWorks', () => {
  it('explains the app in four steps', () => {
    render(
      <MemoryRouter>
        <HowItWorks />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Cómo funciona' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(4)
    expect(screen.getByText('Cada cuy lleva una marca de color')).toBeInTheDocument()
  })

  it('offers to register a cuy or to see the cage', () => {
    render(
      <MemoryRouter>
        <HowItWorks />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'Registrar un cuy' })).toHaveAttribute(
      'href',
      '/guinea-pigs/new',
    )
    expect(screen.getByRole('link', { name: 'Ver mi jaula' })).toHaveAttribute('href', '/')
  })
})
