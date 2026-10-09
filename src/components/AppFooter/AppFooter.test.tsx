import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { AppFooter } from './AppFooter'

describe('AppFooter', () => {
  it('has the "Cómo funciona" link and the name of the app', () => {
    render(
      <MemoryRouter>
        <AppFooter />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'Cómo funciona' })).toHaveAttribute(
      'href',
      '/how-it-works',
    )
    expect(screen.getByText('Monitor de Cuyes')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Pie de página' })).toBeInTheDocument()
  })

  it('links to the main pages and shows the year', () => {
    render(
      <MemoryRouter>
        <AppFooter />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'Alertas' })).toHaveAttribute('href', '/alerts')
    expect(screen.getByRole('link', { name: 'Jaula' })).toHaveAttribute('href', '/')
    expect(screen.getByText(new RegExp(String(new Date().getFullYear())))).toBeInTheDocument()
  })
})
