import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { Privacy, Terms } from './Legal'

describe('Legal', () => {
  it('shows the privacy policy with its sections and a link to the terms', () => {
    render(
      <MemoryRouter>
        <Privacy />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { level: 1, name: 'Política de privacidad' }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(8)
    expect(screen.getByRole('link', { name: 'Términos de uso' })).toHaveAttribute('href', '/terms')
  })

  it('shows the terms of use with a link to the privacy policy', () => {
    render(
      <MemoryRouter>
        <Terms />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Términos de uso' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(9)
    expect(screen.getByRole('link', { name: 'Política de privacidad' })).toHaveAttribute(
      'href',
      '/privacy',
    )
  })
})
