import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../api/ApiError'
import { getDashboardApi } from '../../api/apiProvider'
import type { DashboardApi } from '../../api/DashboardApi'
import { createMockApi } from '../../mocks/createMockApi'
import { MockDatabase } from '../../mocks/MockDatabase'
import { renderWithProviders } from '../../test/render'
import { MARK_COLORS } from '../../types/MarkColor'
import { RegisterGuineaPig } from './RegisterGuineaPig'

vi.mock('../../api/apiProvider', () => ({ getDashboardApi: vi.fn() }))

function renderPage(api: DashboardApi) {
  vi.mocked(getDashboardApi).mockResolvedValue(api)
  renderWithProviders(
    <Routes>
      <Route path="/guinea-pigs/new" element={<RegisterGuineaPig />} />
      <Route path="/" element={<p>cage view</p>} />
    </Routes>,
    { route: '/guinea-pigs/new' },
  )
}

describe('RegisterGuineaPig', () => {
  let db: MockDatabase
  let api: DashboardApi

  beforeEach(() => {
    db = new MockDatabase()
    api = createMockApi(db, 0)
  })

  it('shows which colors are already taken', async () => {
    renderPage(api)

    // the fake cage has Canela (rojo), Pelusa (azul), Copito (blanco) and Chispa (naranja)
    expect(await screen.findByRole('radio', { name: /Rojo/ })).toBeDisabled()
    expect(screen.getByText('Lo lleva Canela')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Verde/ })).toBeEnabled()
  })

  it('asks for the name and the color before sending', async () => {
    const register = vi.spyOn(api.guineaPigs, 'register')
    renderPage(api)

    await userEvent.click(await screen.findByRole('button', { name: 'Registrar cuy' }))

    expect(await screen.findByText('Escribe el nombre del cuy.')).toBeInTheDocument()
    expect(screen.getByText('Elige el color de la marca.')).toBeInTheDocument()
    expect(register).not.toHaveBeenCalled()
  })

  it('registers the guinea pig and goes back to the cage', async () => {
    renderPage(api)

    await userEvent.type(await screen.findByLabelText('Nombre'), '  Manchas ')
    await userEvent.click(screen.getByRole('radio', { name: /Verde/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Registrar cuy' }))

    expect(await screen.findByText('cage view')).toBeInTheDocument()
    expect(db.guineaPigs.find((g) => g.name === 'Manchas')).toMatchObject({
      markColor: 'GREEN',
      status: 'NORMAL',
    })
  })

  it('says so when someone took the color in the meantime', async () => {
    vi.spyOn(api.guineaPigs, 'register').mockRejectedValue(new ApiError(409, 'conflict'))
    renderPage(api)

    await userEvent.type(await screen.findByLabelText('Nombre'), 'Manchas')
    await userEvent.click(screen.getByRole('radio', { name: /Verde/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Registrar cuy' }))

    expect(
      await screen.findByText('Otro cuy ya lleva ese color. Elige uno libre.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('cage view')).not.toBeInTheDocument()
  })

  it('says there is no color left when the cage already has one of each', async () => {
    db.guineaPigs.length = 0
    MARK_COLORS.forEach((markColor, index) =>
      db.guineaPigs.push({
        id: index + 1,
        name: `Cuy ${index + 1}`,
        markColor,
        status: 'NORMAL',
        statusSince: new Date().toISOString(),
      }),
    )
    renderPage(api)

    expect(await screen.findByText(/Ya hay un cuy con cada color/)).toBeInTheDocument()
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
  })

  it('sends the breed, coat, weight and notes when they are filled', async () => {
    renderPage(api)

    await userEvent.type(await screen.findByLabelText('Nombre'), 'Manchas')
    await userEvent.click(screen.getByRole('button', { name: 'Teddy' }))
    await userEvent.click(screen.getByRole('button', { name: 'Crema' }))
    await userEvent.type(screen.getByLabelText(/Peso al llegar/), '875')
    await userEvent.type(screen.getByLabelText('Notas'), '  Come mucha zanahoria ')
    await userEvent.click(screen.getByRole('radio', { name: /Verde/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Registrar cuy' }))

    expect(await screen.findByText('cage view')).toBeInTheDocument()
    expect(db.guineaPigs.find((g) => g.name === 'Manchas')).toMatchObject({
      breed: 'TEDDY',
      coatColor: 'CREAM',
      initialWeightGrams: 875,
      notes: 'Come mucha zanahoria',
    })
  })

  it('keeps them optional: a cuy can still be registered with only a name and a color', async () => {
    renderPage(api)

    await userEvent.type(await screen.findByLabelText('Nombre'), 'Simple')
    await userEvent.click(screen.getByRole('radio', { name: /Verde/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Registrar cuy' }))

    expect(await screen.findByText('cage view')).toBeInTheDocument()
    expect(db.guineaPigs.find((g) => g.name === 'Simple')).toMatchObject({
      breed: null,
      initialWeightGrams: null,
    })
  })

  it('does not send a weight outside the limits', async () => {
    const register = vi.spyOn(api.guineaPigs, 'register')
    renderPage(api)

    await userEvent.type(await screen.findByLabelText('Nombre'), 'Manchas')
    await userEvent.click(screen.getByRole('radio', { name: /Verde/ }))
    await userEvent.type(screen.getByLabelText(/Peso al llegar/), '5')
    await userEvent.click(screen.getByRole('button', { name: 'Registrar cuy' }))

    expect(await screen.findByText('Escribe un peso entre 50 y 2000 g.')).toBeInTheDocument()
    expect(register).not.toHaveBeenCalled()
  })

  it('shows the preview growing with what is typed', async () => {
    renderPage(api)

    const preview = await screen.findByRole('complementary', { name: 'Así se verá' })
    expect(within(preview).getByText('Su nombre')).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Nombre'), 'Manchas')
    await userEvent.click(screen.getByRole('button', { name: 'Abisinio' }))
    await userEvent.type(screen.getByLabelText(/Peso al llegar/), '900')

    expect(within(preview).getByText('Manchas')).toBeInTheDocument()
    expect(within(preview).getByText('Abisinio')).toBeInTheDocument()
    expect(within(preview).getByText('900 g')).toBeInTheDocument()
  })
})
