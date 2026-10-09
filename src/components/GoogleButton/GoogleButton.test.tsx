import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadGoogleIdentity, type GoogleAccountsId } from '../../auth/googleIdentity'
import { config } from '../../config'
import { MOCK_GOOGLE_TOKEN } from '../../mocks/googleToken'
import { GoogleButton } from './GoogleButton'

vi.mock('../../auth/googleIdentity', () => ({ loadGoogleIdentity: vi.fn() }))

const original = { useMocks: config.useMocks, googleClientId: config.googleClientId }

afterEach(() => {
  config.useMocks = original.useMocks
  config.googleClientId = original.googleClientId
  vi.mocked(loadGoogleIdentity).mockReset()
})

describe('GoogleButton', () => {
  it('shows nothing without a client id', () => {
    config.useMocks = false
    config.googleClientId = ''

    const { container } = render(<GoogleButton onCredential={() => {}} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('offers a demo button with the mocks that sends the demo token', async () => {
    config.useMocks = true
    const onCredential = vi.fn()
    render(<GoogleButton onCredential={onCredential} />)

    await userEvent.click(screen.getByRole('button', { name: /Continuar con Google/ }))

    expect(onCredential).toHaveBeenCalledWith(MOCK_GOOGLE_TOKEN)
  })

  it('draws the Google button and forwards the credential Google returns', async () => {
    config.useMocks = false
    config.googleClientId = 'abc.apps.googleusercontent.com'
    const initialize = vi.fn()
    const renderButton = vi.fn()
    vi.mocked(loadGoogleIdentity).mockResolvedValue({
      initialize,
      renderButton,
    } as unknown as GoogleAccountsId)
    const onCredential = vi.fn()

    render(<GoogleButton onCredential={onCredential} text="signup_with" />)

    await waitFor(() => expect(renderButton).toHaveBeenCalled())
    expect(initialize).toHaveBeenCalledWith(
      expect.objectContaining({ client_id: 'abc.apps.googleusercontent.com' }),
    )
    expect(renderButton.mock.calls[0][1]).toMatchObject({ text: 'signup_with', locale: 'es' })

    const { callback } = initialize.mock.calls[0][0] as {
      callback: (response: { credential?: string }) => void
    }
    callback({})
    expect(onCredential).not.toHaveBeenCalled()
    callback({ credential: 'google-jwt' })
    expect(onCredential).toHaveBeenCalledWith('google-jwt')
  })

  it('says so when the Google script cannot load', async () => {
    config.useMocks = false
    config.googleClientId = 'abc.apps.googleusercontent.com'
    vi.mocked(loadGoogleIdentity).mockRejectedValue(new Error('blocked'))

    render(<GoogleButton onCredential={() => {}} />)

    expect(await screen.findByText(/No pudimos cargar el acceso con Google/)).toBeInTheDocument()
  })
})
