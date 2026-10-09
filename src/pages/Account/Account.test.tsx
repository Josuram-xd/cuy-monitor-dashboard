import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getDashboardApi } from '../../api/apiProvider'
import type { DashboardApi } from '../../api/DashboardApi'
import { AuthContext, type AuthContextValue } from '../../auth/AuthContext'
import { createMockApi } from '../../mocks/createMockApi'
import { MOCK_GOOGLE_TOKEN } from '../../mocks/googleToken'
import { mockSession } from '../../mocks/mockSession'
import { MOCK_OTP_CODE } from '../../mocks/MockAuthApi'
import { MockDatabase } from '../../mocks/MockDatabase'
import { renderWithProviders } from '../../test/render'
import { Account } from './Account'

vi.mock('../../api/apiProvider', () => ({ getDashboardApi: vi.fn() }))

const PASSWORD = 'clave-demo-123'

async function signedInApi(): Promise<DashboardApi> {
  const api = createMockApi(new MockDatabase(), 0)
  const challenge = await api.auth.login({ username: 'ana', password: PASSWORD })
  await api.auth.verifyOtp({ challengeId: challenge.challengeId, code: MOCK_OTP_CODE })
  return api
}

function renderAccount(api: DashboardApi) {
  vi.mocked(getDashboardApi).mockResolvedValue(api)
  const logout = vi.fn()
  const auth: AuthContextValue = {
    status: 'authenticated',
    isAuthenticated: true,
    lastLogoutReason: null,
    signIn: () => {},
    logout,
    retry: () => {},
  }
  renderWithProviders(
    <AuthContext.Provider value={auth}>
      <Account />
    </AuthContext.Provider>,
  )
  return { logout }
}

describe('Account', () => {
  beforeEach(() => {
    mockSession.end()
  })

  it('shows who is logged in', async () => {
    renderAccount(await signedInApi())

    expect(await screen.findByRole('heading', { name: 'ana' })).toBeInTheDocument()
    expect(screen.getByText('@ana')).toBeInTheDocument()
    expect(screen.getByLabelText('Usuario')).toHaveAttribute('readonly')
  })

  it('saves a new name only when it changed and is not empty', async () => {
    const api = await signedInApi()
    renderAccount(api)
    const save = await screen.findByRole('button', { name: 'Guardar cambios' })
    expect(save).toBeDisabled()

    await userEvent.clear(screen.getByLabelText('Nombre completo'))
    expect(await screen.findByText('Escribe tu nombre.')).toBeInTheDocument()
    expect(save).toBeDisabled()

    await userEvent.type(screen.getByLabelText('Nombre completo'), 'Ana Ruiz')
    await userEvent.click(save)

    expect(await screen.findByText('Listo, guardamos tu nombre.')).toBeInTheDocument()
    await expect(api.account.getProfile()).resolves.toEqual({
      username: 'ana',
      fullName: 'Ana Ruiz',
      hasPassword: true,
    })
  })

  it('changes the password and clears the fields', async () => {
    const api = await signedInApi()
    renderAccount(api)

    await userEvent.type(await screen.findByLabelText('Contraseña actual'), PASSWORD)
    await userEvent.type(screen.getByLabelText('Contraseña nueva'), 'Otra-clave-456!')
    await userEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))

    expect(await screen.findByText('Listo, tu contraseña cambió.')).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña actual')).toHaveValue('')
    expect(screen.getByLabelText('Contraseña nueva')).toHaveValue('')
  })

  it('says the current password is wrong and keeps the session', async () => {
    const { logout } = renderAccount(await signedInApi())

    await userEvent.type(await screen.findByLabelText('Contraseña actual'), 'no-es-esta')
    await userEvent.type(screen.getByLabelText('Contraseña nueva'), 'Otra-clave-456!')
    await userEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))

    expect(await screen.findByText('La contraseña actual no es correcta.')).toBeInTheDocument()
    expect(logout).not.toHaveBeenCalled()
  })

  it('does not send a new password that is too short', async () => {
    const api = await signedInApi()
    const changePassword = vi.spyOn(api.account, 'changePassword')
    renderAccount(api)

    await userEvent.type(await screen.findByLabelText('Contraseña actual'), PASSWORD)
    await userEvent.type(screen.getByLabelText('Contraseña nueva'), 'corta')
    await userEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))

    expect(
      await screen.findByText('La contraseña no cumple todos los requisitos.'),
    ).toBeInTheDocument()
    expect(changePassword).not.toHaveBeenCalled()
  })

  it('asks for the password before deactivating, and cancels with Escape', async () => {
    const api = await signedInApi()
    const deactivate = vi.spyOn(api.account, 'deactivate')
    const { logout } = renderAccount(api)

    await userEvent.click(await screen.findByRole('button', { name: 'Desactivar mi cuenta' }))
    expect(screen.getByRole('dialog', { name: '¿Desactivar tu cuenta?' })).toBeInTheDocument()

    await userEvent.keyboard('{Escape}')

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(deactivate).not.toHaveBeenCalled()
    expect(logout).not.toHaveBeenCalled()
  })

  it('keeps the account when the password is wrong, and logs out when it is right', async () => {
    const { logout } = renderAccount(await signedInApi())
    await userEvent.click(await screen.findByRole('button', { name: 'Desactivar mi cuenta' }))
    const dialog = screen.getByRole('dialog')
    const field = () => within(dialog).getByLabelText('Tu contraseña')

    await userEvent.type(field(), 'no-es-esta')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Sí, desactivar' }))
    expect(
      await within(dialog).findByText('La contraseña actual no es correcta.'),
    ).toBeInTheDocument()
    expect(logout).not.toHaveBeenCalled()

    await userEvent.clear(field())
    await userEvent.type(field(), PASSWORD)
    await userEvent.click(within(dialog).getByRole('button', { name: 'Sí, desactivar' }))

    await waitFor(() => expect(logout).toHaveBeenCalledWith('disabled'))
  })

  it('logs out from the header of the page', async () => {
    const { logout } = renderAccount(await signedInApi())

    await userEvent.click(await screen.findByRole('button', { name: 'Cerrar sesión' }))

    expect(logout).toHaveBeenCalledWith('logout')
  })

  describe('an account made with Google', () => {
    async function googleApi(): Promise<DashboardApi> {
      const api = createMockApi(new MockDatabase(), 0)
      await api.auth.googleLogin({ idToken: MOCK_GOOGLE_TOKEN })
      return api
    }

    it('creates its first password without asking for an old one', async () => {
      const api = await googleApi()
      renderAccount(api)

      expect(await screen.findByRole('heading', { name: 'Crear contraseña' })).toBeInTheDocument()
      expect(screen.queryByLabelText('Contraseña actual')).not.toBeInTheDocument()

      await userEvent.type(screen.getByLabelText('Contraseña nueva'), 'Otra-clave-456!')
      await userEvent.click(screen.getByRole('button', { name: 'Crear contraseña' }))

      expect(await screen.findByText('Listo, tu contraseña cambió.')).toBeInTheDocument()
      await expect(api.account.getProfile()).resolves.toMatchObject({ hasPassword: true })
    })

    it('deactivates the account without typing a password', async () => {
      const api = await googleApi()
      const { logout } = renderAccount(api)

      await userEvent.click(await screen.findByRole('button', { name: 'Desactivar mi cuenta' }))
      const dialog = screen.getByRole('dialog')
      expect(within(dialog).queryByLabelText('Tu contraseña')).not.toBeInTheDocument()
      await userEvent.click(within(dialog).getByRole('button', { name: 'Sí, desactivar' }))

      await waitFor(() => expect(logout).toHaveBeenCalledWith('disabled'))
    })
  })
})
