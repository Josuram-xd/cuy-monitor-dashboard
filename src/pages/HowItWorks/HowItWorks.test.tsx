import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getDashboardApi } from '../../api/apiProvider'
import { createMockApi } from '../../mocks/createMockApi'
import { mockSession } from '../../mocks/mockSession'
import { renderWithProviders } from '../../test/render'
import { HowItWorks } from './HowItWorks'

vi.mock('../../api/apiProvider', () => ({ getDashboardApi: vi.fn() }))

describe('HowItWorks', () => {
  beforeEach(() => {
    vi.mocked(getDashboardApi).mockResolvedValue(createMockApi(undefined, 0))
  })

  afterEach(() => {
    mockSession.end()
  })

  it('explains the app in four steps', () => {
    renderWithProviders(<HowItWorks />)

    expect(screen.getByRole('heading', { level: 1, name: 'Cómo funciona' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(4)
    expect(screen.getByText('Cada cuy lleva una marca de color')).toBeInTheDocument()
  })

  it('offers to register a guinea pig or to see the cage', () => {
    renderWithProviders(<HowItWorks />)

    expect(screen.getByRole('link', { name: 'Registrar un cuy' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Ver mis jaulas' })).toHaveAttribute('href', '/')
  })

  it('says nothing about the admin panel to a breeder', async () => {
    renderWithProviders(<HowItWorks />)

    await screen.findByText('Cada cuy lleva una marca de color')
    expect(screen.queryByRole('region', { name: 'Para administradores' })).not.toBeInTheDocument()
  })

  it('explains each tab of the admin panel to an admin, with a way there', async () => {
    // in mock mode a signed-in account is an admin
    mockSession.start()
    renderWithProviders(<HowItWorks />)

    const admin = await screen.findByRole('region', { name: 'Para administradores' })
    for (const tab of ['Cuentas', 'Reglas de salud', 'Catálogo', 'Registros']) {
      expect(admin).toHaveTextContent(tab)
    }
    expect(screen.getByRole('link', { name: 'Ir a Administración' })).toHaveAttribute(
      'href',
      '/admin',
    )
  })
})
