import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getDashboardApi } from '../api/apiProvider'
import { UnauthorizedNotifier } from '../api/UnauthorizedNotifier'
import { AuthProvider } from '../auth/AuthProvider'
import { pendingVerification } from '../auth/pendingVerification'
import { PublicOnlyRoute } from '../auth/PublicOnlyRoute'
import { RequireAuth } from '../auth/RequireAuth'
import { createMockApi } from '../mocks/createMockApi'
import { mockSession } from '../mocks/mockSession'
import { Login } from './Login/Login'
import { Register } from './Register/Register'
import { VerifyCode } from './VerifyCode/VerifyCode'

vi.mock('../api/apiProvider', () => ({ getDashboardApi: vi.fn() }))

function renderApp(path: string) {
  const router = createMemoryRouter(
    [
      {
        element: <PublicOnlyRoute />,
        children: [
          { path: 'login', element: <Login /> },
          { path: 'register', element: <Register /> },
          { path: 'verify', element: <VerifyCode /> },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          { index: true, element: <p>private cage</p> },
          { path: 'alerts', element: <p>private alerts</p> },
        ],
      },
    ],
    { initialEntries: [path] },
  )
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider notifier={new UnauthorizedNotifier()}>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
  )
}

function codeInput() {
  return screen.getByRole('textbox', { name: /Código de verificación/ })
}

describe('auth flow with the mocks', () => {
  beforeEach(() => {
    mockSession.end()
    vi.mocked(getDashboardApi).mockResolvedValue(createMockApi(undefined, 0))
  })

  afterEach(() => {
    pendingVerification.clear()
  })

  it('logs in with the code and lands on the page it asked for', async () => {
    renderApp('/login?next=%2Falerts')

    await userEvent.type(await screen.findByLabelText('Usuario'), 'juan')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'secret-pass')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(
      await screen.findByRole('heading', { name: 'Código de verificación' }),
    ).toBeInTheDocument()

    await userEvent.type(codeInput(), '000000')
    expect(await screen.findByText(/El código no es correcto/)).toBeInTheDocument()
    expect(codeInput()).toHaveValue('')

    await userEvent.type(codeInput(), '123456')
    expect(await screen.findByText('private alerts')).toBeInTheDocument()
  })

  it('shows the masked email after registering', async () => {
    renderApp('/register')

    await userEvent.type(await screen.findByLabelText('Usuario'), 'ana')
    await userEvent.type(screen.getByLabelText('Nombre completo'), 'Ana Ruiz')
    await userEvent.type(screen.getByLabelText('Correo'), 'ana@mail.com')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'secret-pass')
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(await screen.findByText(/a•••@mail\.com/)).toBeInTheDocument()
  })

  it('does not send the form with a short password', async () => {
    renderApp('/register')

    await userEvent.type(await screen.findByLabelText('Contraseña'), 'short')
    await userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(screen.getByLabelText('Contraseña')).toHaveAccessibleDescription(
      'La contraseña debe tener entre 8 y 72 caracteres.',
    )
    expect(
      screen.queryByRole('heading', { name: 'Código de verificación' }),
    ).not.toBeInTheDocument()
  })

  it('keeps the session across a reload: no login form for someone who already has the cookie', async () => {
    mockSession.start()

    renderApp('/login')

    expect(await screen.findByText('private cage')).toBeInTheDocument()
    expect(screen.queryByLabelText('Usuario')).not.toBeInTheDocument()
  })

  it('goes back to /login when /verify is opened without a code request (e.g. after a reload)', async () => {
    renderApp('/verify')

    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })
})
