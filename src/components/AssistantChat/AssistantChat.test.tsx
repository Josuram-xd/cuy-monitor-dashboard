import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../api/ApiError'
import { getDashboardApi } from '../../api/apiProvider'
import type { DashboardApi } from '../../api/DashboardApi'
import { createMockApi } from '../../mocks/createMockApi'
import { renderWithProviders } from '../../test/render'
import { AssistantChat } from './AssistantChat'

vi.mock('../../api/apiProvider', () => ({ getDashboardApi: vi.fn() }))

let api: DashboardApi

describe('AssistantChat', () => {
  beforeEach(() => {
    api = createMockApi(undefined, 0)
    vi.mocked(getDashboardApi).mockResolvedValue(api)
  })

  async function openChat() {
    const user = userEvent.setup()
    renderWithProviders(<AssistantChat />)
    await user.click(screen.getByRole('button', { name: 'Abrir la ayuda de Cuchi' }))
    return user
  }

  it('opens with a greeting and suggestions, and closes again', async () => {
    const user = await openChat()

    expect(screen.getByRole('dialog', { name: 'Cuchi, tu ayudante' })).toBeInTheDocument()
    expect(screen.getByText(/Soy Cuchi/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '¿Cómo registro un cuy?' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Escribe tu pregunta' })).toHaveFocus()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('sends the question without the greeting and shows the answer', async () => {
    const ask = vi.spyOn(api.assistant, 'ask')
    const user = await openChat()

    await user.type(screen.getByRole('textbox'), '¿Qué hago con una alerta?{Enter}')

    expect(await screen.findByText(/llévalo al veterinario/)).toBeInTheDocument()
    expect(screen.getByText('¿Qué hago con una alerta?')).toBeInTheDocument()
    expect(ask).toHaveBeenCalledWith({
      language: 'es',
      messages: [{ role: 'USER', text: '¿Qué hago con una alerta?' }],
    })
    // the suggestions go away once the conversation started
    expect(screen.queryByRole('button', { name: '¿Cómo registro un cuy?' })).not.toBeInTheDocument()
  })

  it('a suggestion is sent as a question and the history travels with the next one', async () => {
    const ask = vi.spyOn(api.assistant, 'ask')
    const user = await openChat()

    await user.click(screen.getByRole('button', { name: '¿Cómo registro un cuy?' }))
    await screen.findByText(/Registrar cuy/)
    await user.type(screen.getByRole('textbox'), 'gracias{Enter}')

    await waitFor(() => expect(ask).toHaveBeenCalledTimes(2))
    const second = ask.mock.calls[1][0]
    expect(second.messages.map((m) => m.role)).toEqual(['USER', 'ASSISTANT', 'USER'])
  })

  it('an empty question cannot be sent', async () => {
    await openChat()

    expect(screen.getByRole('button', { name: 'Enviar' })).toBeDisabled()
  })

  it('says in plain words when the assistant is not available or was asked too much', async () => {
    const ask = vi
      .spyOn(api.assistant, 'ask')
      .mockRejectedValueOnce(new ApiError(503, 'service_unavailable'))
      .mockRejectedValueOnce(new ApiError(429, 'too_many_requests'))
    const user = await openChat()

    await user.type(screen.getByRole('textbox'), 'hola{Enter}')
    expect(await screen.findByRole('alert')).toHaveTextContent('Cuchi no puede responder ahora')

    await user.type(screen.getByRole('textbox'), 'hola otra vez{Enter}')
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Hiciste muchas preguntas seguidas'),
    )
    expect(ask).toHaveBeenCalledTimes(2)
  })

  it('steps aside while the page scrolls down and comes back when it scrolls up', async () => {
    renderWithProviders(<AssistantChat />)
    const toggle = screen.getByRole('button', { name: 'Abrir la ayuda de Cuchi' })
    const root = toggle.parentElement!
    const scrollTo = (y: number) => {
      Object.defineProperty(window, 'scrollY', { value: y, configurable: true })
      window.dispatchEvent(new Event('scroll'))
    }

    act(() => scrollTo(400))
    expect(root.className).toMatch(/tucked/)

    // a small nudge up made by the layout itself does not bring it back
    act(() => scrollTo(392))
    expect(root.className).toMatch(/tucked/)

    act(() => scrollTo(200))
    expect(root.className).not.toMatch(/tucked/)
  })
})
