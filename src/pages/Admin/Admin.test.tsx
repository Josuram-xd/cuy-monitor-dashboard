import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getDashboardApi } from '../../api/apiProvider'
import { createMockApi } from '../../mocks/createMockApi'
import { MockDatabase } from '../../mocks/MockDatabase'
import { mockSession } from '../../mocks/mockSession'
import { renderWithProviders } from '../../test/render'
import { Admin } from './Admin'

vi.mock('../../api/apiProvider', () => ({ getDashboardApi: vi.fn() }))

function setup() {
  // without the fake "cookie" the profile answers 401 and the panel cannot tell which row is yours
  mockSession.start()
  const api = createMockApi(new MockDatabase(), 0)
  vi.mocked(getDashboardApi).mockResolvedValue(api)
  renderWithProviders(<Admin />)
  return { api }
}

const catalog = () => screen.findByRole('region', { name: 'Catálogo' })
const accounts = () => screen.findByRole('region', { name: 'Cuentas' })

describe('Admin', () => {
  beforeEach(() => {
    vi.mocked(getDashboardApi).mockReset()
  })

  afterEach(() => {
    mockSession.end()
  })

  it('shows the breeds first, with the code that gets stored', async () => {
    setup()

    const section = await catalog()
    expect(await within(section).findByText('Americano')).toBeInTheDocument()
    expect(within(section).getByText('AMERICAN')).toBeInTheDocument()
  })

  it('adds a breed that did not exist, which is the point of the panel', async () => {
    const user = userEvent.setup()
    setup()
    const section = await catalog()
    await within(section).findByText('Americano')

    await user.type(within(section).getByLabelText('Nombre'), 'Cuy colombiano')
    // the code is derived, so nobody has to know about upper case and underscores
    expect(within(section).getByLabelText('Código')).toHaveValue('CUY_COLOMBIANO')

    await user.click(within(section).getByRole('button', { name: 'Añadir' }))

    expect(await within(section).findByText('Cuy colombiano')).toBeInTheDocument()
    // and the form is empty again, ready for the next one
    expect(within(section).getByLabelText('Nombre')).toHaveValue('')
  })

  it('refuses a name it cannot build a code from', async () => {
    const user = userEvent.setup()
    setup()
    const section = await catalog()
    await within(section).findByText('Americano')

    await user.type(within(section).getByLabelText('Nombre'), '¿!')
    await user.click(within(section).getByRole('button', { name: 'Añadir' }))

    expect(await within(section).findByRole('alert')).toHaveTextContent(/código/i)
  })

  it('will not add a code that is already in the list', async () => {
    const user = userEvent.setup()
    setup()
    const section = await catalog()
    await within(section).findByText('Americano')

    await user.type(within(section).getByLabelText('Nombre'), 'Cuy colombiano')
    await user.click(within(section).getByRole('button', { name: 'Añadir' }))
    await within(section).findByText('Cuy colombiano')

    await user.type(within(section).getByLabelText('Nombre'), 'Cuy colombiano')
    await user.click(within(section).getByRole('button', { name: 'Añadir' }))

    expect(await within(section).findByRole('alert')).toHaveTextContent(/ya existe/i)
  })

  it('hides an option after saying what happens to the guinea pigs using it', async () => {
    const user = userEvent.setup()
    setup()
    const section = await catalog()
    await within(section).findByText('Americano')

    await user.click(within(section).getByRole('button', { name: 'Ocultar «Americano»' }))

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent(/los cuyes que ya la tienen la conservan/i)
    await user.click(within(dialog).getByRole('button', { name: 'Ocultar' }))

    // still listed, so it can be brought back, but no longer offered
    expect(
      await within(section).findByRole('button', { name: 'Volver a mostrar «Americano»' }),
    ).toBeInTheDocument()
  })

  it('switches the catalog to the colors, which are the other lists', async () => {
    const user = userEvent.setup()
    setup()
    const section = await catalog()
    await within(section).findByText('Americano')

    await user.click(within(section).getByRole('radio', { name: 'Colores de marca' }))

    expect(await within(section).findByText('Rojo')).toBeInTheDocument()
    // a mark color is drawn as a dot, so this list asks for a color
    expect(within(section).getByLabelText(/Color/)).toBeInTheDocument()
  })

  it('marks your own account and gives it no buttons', async () => {
    setup()

    const section = await accounts()
    const me = (await within(section).findByText('Usuario de prueba')).closest('li')
    expect(me).not.toBeNull()
    expect(within(me as HTMLElement).getByText('Tú')).toBeInTheDocument()
    expect(within(me as HTMLElement).queryByRole('button')).toBeNull()
  })

  it('names another admin after explaining what that gives them', async () => {
    const user = userEvent.setup()
    setup()
    const section = await accounts()
    const row = (await within(section).findByText('Ana Quispe')).closest('li') as HTMLElement

    await user.click(within(row).getByRole('button', { name: 'Hacer administrador' }))

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent(/editar el catálogo/i)
    await user.click(within(dialog).getByRole('button', { name: 'Hacer administrador' }))

    await waitFor(() => {
      expect(within(row).getByText('Administrador')).toBeInTheDocument()
    })
  })

  it('does not offer to demote the only admin', async () => {
    setup()

    const section = await accounts()
    // the demo account is the only admin, and it is also ours, so there is no such button at all
    await within(section).findByText('Ana Quispe')
    expect(screen.queryByRole('button', { name: 'Quitar administrador' })).toBeNull()
  })

  it('disables an account and says the cages are kept', async () => {
    const user = userEvent.setup()
    setup()
    const section = await accounts()
    const row = (await within(section).findByText('Ana Quispe')).closest('li') as HTMLElement

    await user.click(within(row).getByRole('button', { name: 'Deshabilitar' }))

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent(/no se borran/i)
    await user.click(within(dialog).getByRole('button', { name: 'Deshabilitar' }))

    await waitFor(() => {
      expect(within(row).getByText('Deshabilitada')).toBeInTheDocument()
    })
    expect(within(row).getByRole('button', { name: 'Habilitar' })).toBeInTheDocument()
  })
})
