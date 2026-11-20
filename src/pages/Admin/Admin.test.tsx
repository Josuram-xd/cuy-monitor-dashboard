import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getDashboardApi } from '../../api/apiProvider'
import { createMockApi } from '../../mocks/createMockApi'
import { MockDatabase } from '../../mocks/MockDatabase'
import { mockSession } from '../../mocks/mockSession'
import { Route, Routes } from 'react-router'
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

// the panel shows one section at a time, chosen from its nav bar
async function openTab(name: string) {
  const nav = await screen.findByRole('navigation', { name: 'Qué quieres configurar' })
  await userEvent.click(within(nav).getByRole('button', { name }))
}

const catalog = async () => {
  await openTab('Catálogo')
  return screen.findByRole('region', { name: 'Catálogo' })
}
const actionLog = async () => {
  await openTab('Registro de acciones')
  return screen.findByRole('region', { name: 'Registro de acciones' })
}
const accounts = () => screen.findByRole('region', { name: 'Cuentas' })

describe('Admin', () => {
  beforeEach(() => {
    vi.mocked(getDashboardApi).mockReset()
  })

  afterEach(() => {
    mockSession.end()
    localStorage.clear()
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

  it('logs a catalog change in the action log', async () => {
    const user = userEvent.setup()
    setup()
    const section = await catalog()
    await within(section).findByText('Americano')

    await user.type(within(section).getByLabelText('Nombre'), 'Cuy colombiano')
    await user.click(within(section).getByRole('button', { name: 'Añadir' }))
    await within(section).findByText('Cuy colombiano')

    const log = await actionLog()
    expect(within(log).getByText('Añadiste «Cuy colombiano» al catálogo')).toBeInTheDocument()
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

  it('names another admin only after confirming twice, and logs it with the email', async () => {
    const user = userEvent.setup()
    const { api } = setup()
    const changeRole = vi.spyOn(api.admin, 'changeUserRole')
    const section = await accounts()
    const row = (await within(section).findByText('Ana Quispe')).closest('li') as HTMLElement

    await user.click(within(row).getByRole('button', { name: /^Hacer administrador a / }))

    const first = await screen.findByRole('dialog')
    expect(first).toHaveTextContent(/editar el catálogo/i)
    await user.click(within(first).getByRole('button', { name: 'Continuar' }))
    // nothing changed yet: the first yes only opens the final confirmation
    expect(changeRole).not.toHaveBeenCalled()

    const final = await screen.findByRole('dialog')
    expect(final).toHaveTextContent(/Confirmación final/)
    expect(final).toHaveTextContent('ana@cuymonitor.local')
    await user.click(within(final).getByRole('button', { name: 'Hacer administrador' }))

    await waitFor(() => {
      expect(within(row).getByText('Administrador')).toBeInTheDocument()
    })
    const log = await actionLog()
    expect(
      within(log).getByText('Hiciste administrador a Ana Quispe (ana@cuymonitor.local)'),
    ).toBeInTheDocument()
    expect(within(log).getByText('Hecho')).toBeInTheDocument()
  })

  it('changes nothing when the final confirmation is cancelled', async () => {
    const user = userEvent.setup()
    const { api } = setup()
    const changeRole = vi.spyOn(api.admin, 'changeUserRole')
    const row = (await within(await accounts()).findByText('Ana Quispe')).closest(
      'li',
    ) as HTMLElement

    await user.click(within(row).getByRole('button', { name: /^Hacer administrador a / }))
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Continuar' }),
    )
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Cancelar' }),
    )

    expect(changeRole).not.toHaveBeenCalled()
    expect(within(row).getByText('Criador')).toBeInTheDocument()
  })

  it('leaves no way to demote the only admin', async () => {
    setup()

    const section = await accounts()
    await within(section).findByText('Ana Quispe')
    // the only admin is your own account, and your own row has no buttons, so losing the last admin
    // is not something the screen can even offer
    expect(screen.queryByRole('button', { name: 'Quitar administrador' })).toBeNull()
  })

  it('disables an account and says the cages are kept', async () => {
    const user = userEvent.setup()
    setup()
    const section = await accounts()
    const row = (await within(section).findByText('Ana Quispe')).closest('li') as HTMLElement

    await user.click(within(row).getByRole('button', { name: /^Deshabilitar a / }))

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent(/no se borran/i)
    await user.click(within(dialog).getByRole('button', { name: 'Deshabilitar' }))

    await waitFor(() => {
      expect(within(row).getByText('Deshabilitada')).toBeInTheDocument()
    })
    expect(within(row).getByRole('button', { name: /^Habilitar a / })).toBeInTheDocument()
  })

  it('takes a breeder to the cages, without a warning and without asking the admin endpoints', async () => {
    mockSession.start()
    const api = createMockApi(new MockDatabase(), 0)
    const profile = await api.account.getProfile()
    vi.spyOn(api.account, 'getProfile').mockResolvedValue({ ...profile, role: 'BREEDER' })
    const users = vi.spyOn(api.admin, 'listUsers')
    const options = vi.spyOn(api.admin, 'listCatalog')
    vi.mocked(getDashboardApi).mockResolvedValue(api)
    renderWithProviders(
      <Routes>
        <Route path="/admin" element={<Admin />} />
        <Route path="/" element={<p>{'the cages'}</p>} />
      </Routes>,
      { route: '/admin' },
    )

    expect(await screen.findByText('the cages')).toBeInTheDocument()
    expect(screen.queryByText('Esta sección es solo para administradores.')).not.toBeInTheDocument()
    expect(users).not.toHaveBeenCalled()
    expect(options).not.toHaveBeenCalled()
  })

  it('sums up each account without showing its cages', async () => {
    setup()

    const region = await accounts()
    expect(
      await within(region).findByText(/30 jaulas · 96 cuyes · 7 alertas abiertas/),
    ).toBeInTheDocument()
    expect(within(region).getByText(/Aún no recibe datos/)).toBeInTheDocument()
  })

  it('lists what the AI did, its advice included', async () => {
    setup()

    await openTab('Registro de la IA')
    const region = await screen.findByRole('region', { name: 'Registro de la IA' })
    expect(await within(region).findByText(/revísalo y, si sigue así/)).toBeInTheDocument()
    expect(within(region).getByText('Recomendación')).toBeInTheDocument()
    expect(within(region).getByText(/DISTRESS/)).toBeInTheDocument()
  })

  it('saves only the rule that changed, says so, and logs the old and new value', async () => {
    const user = userEvent.setup()
    const { api } = setup()
    const update = vi.spyOn(api.admin, 'updateSettings')
    await openTab('Reglas de salud')
    const region = await screen.findByRole('region', { name: 'Reglas de salud' })
    const field = await within(region).findByLabelText('Minutos en observación antes de la alerta')

    await user.clear(field)
    await user.type(field, '20')
    await user.click(within(region).getByRole('button', { name: 'Guardar 1 cambios' }))

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith({ 'health.observedToAlertMinutes': '20' }),
    )
    const log = await actionLog()
    expect(
      await within(log).findByText(/Minutos en observación antes de la alerta: «30» → «20»/),
    ).toBeInTheDocument()
  })

  it('goes back to the defaults after confirming', async () => {
    const user = userEvent.setup()
    const { api } = setup()
    const reset = vi.spyOn(api.admin, 'resetSettings')
    await openTab('Reglas de salud')
    const region = await screen.findByRole('region', { name: 'Reglas de salud' })

    await user.click(
      within(region).getByRole('button', { name: 'Volver a los valores de fábrica' }),
    )
    const dialog = await screen.findByRole('dialog')
    await user.click(
      within(dialog).getByRole('button', { name: 'Volver a los valores de fábrica' }),
    )

    await waitFor(() => expect(reset).toHaveBeenCalledTimes(1))
  })
})

describe('Admin navigation', () => {
  afterEach(() => {
    mockSession.end()
    localStorage.clear()
  })

  it('shows one section at a time, starting with the accounts', async () => {
    setup()

    expect(await screen.findByRole('region', { name: 'Cuentas' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Catálogo' })).not.toBeInTheDocument()

    await openTab('Textos de alertas')
    const texts = await screen.findByRole('region', { name: 'Textos de las alertas' })
    expect(within(texts).getByLabelText('Texto de una alerta')).toBeInTheDocument()
    // the health rules are in their own tab, not mixed with the texts
    expect(
      within(texts).queryByLabelText('Minutos en observación antes de la alerta'),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Cuentas' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Textos de alertas' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })
})
