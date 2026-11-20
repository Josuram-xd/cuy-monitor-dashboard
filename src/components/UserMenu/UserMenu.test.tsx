import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getDashboardApi } from '../../api/apiProvider'
import { UnauthorizedNotifier } from '../../api/UnauthorizedNotifier'
import { AuthProvider } from '../../auth/AuthProvider'
import { changeLanguage } from '../../i18n'
import { createMockApi } from '../../mocks/createMockApi'
import { PreferencesProvider } from '../../preferences/PreferencesProvider'
import { UserMenu } from './UserMenu'

vi.mock('../../api/apiProvider', () => ({ getDashboardApi: vi.fn() }))

describe('UserMenu', () => {
  afterEach(async () => {
    await changeLanguage('es')
    localStorage.clear()
  })

  it('switches between Spanish and English in one click, naming the other language in itself', async () => {
    vi.mocked(getDashboardApi).mockResolvedValue(createMockApi(undefined, 0))
    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <AuthProvider notifier={new UnauthorizedNotifier()} onLogout={vi.fn()}>
          <PreferencesProvider>
            <MemoryRouter>
              <UserMenu />
            </MemoryRouter>
          </PreferencesProvider>
        </AuthProvider>
      </QueryClientProvider>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Menú de la cuenta' }))
    const toEnglish = screen.getByRole('button', { name: 'Switch to English' })
    expect(toEnglish).toHaveTextContent('English')
    expect(toEnglish).toHaveAttribute('lang', 'en')

    await userEvent.click(toEnglish)

    expect(await screen.findByRole('button', { name: 'Cambiar a español' })).toHaveTextContent(
      'Español',
    )
    expect(screen.getByText('My account')).toBeInTheDocument()
  })
})
