import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getDashboardApi } from '../../api/apiProvider'
import type { DashboardApi } from '../../api/DashboardApi'
import { createMockApi } from '../../mocks/createMockApi'
import { renderWithProviders } from '../../test/render'
import type { StationCamera } from '../../types/StationCamera'
import { CameraSetup } from './CameraSetup'

vi.mock('../../api/apiProvider', () => ({ getDashboardApi: vi.fn() }))

const SAVED_RTSP: StationCamera = {
  type: 'RTSP',
  host: '192.168.1.60',
  port: 554,
  username: 'cuy',
  stream: 'stream2',
  hasPassword: true,
  status: 'CONNECTED',
  statusAt: '2026-11-20T10:00:00Z',
}

function setApi(api: DashboardApi) {
  vi.mocked(getDashboardApi).mockResolvedValue(api)
}

function renderSetup() {
  return renderWithProviders(<CameraSetup cageId="cage-1" />)
}

describe('CameraSetup', () => {
  beforeEach(() => {
    setApi(createMockApi(undefined, 0))
  })

  it('shows that there is no camera yet, with the guide open', async () => {
    renderSetup()

    expect(await screen.findByText('Aún no hay una cámara configurada.')).toBeInTheDocument()
    const guide = screen.getByText('¿Cómo conecto la cámara?').closest('details')
    expect(guide).toHaveAttribute('open')
    expect(screen.getByText('Cámara Tapo C200')).toBeInTheDocument()
  })

  it('hides the Tapo fields when the phone is chosen', async () => {
    renderSetup()
    await userEvent.click(await screen.findByRole('button', { name: 'Configurar cámara' }))

    expect(screen.getByLabelText('Usuario de la cámara')).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña de la cámara')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Baja (para laptops lentas)' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('radio', { name: 'Celular con IP Webcam' }))

    expect(screen.queryByLabelText('Usuario de la cámara')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Contraseña de la cámara')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('radio', { name: 'Baja (para laptops lentas)' }),
    ).not.toBeInTheDocument()
  })

  it('saves without a password when the saved one is kept', async () => {
    const api = createMockApi(undefined, 0)
    api.cages.getCamera = async () => SAVED_RTSP
    api.cages.saveCamera = vi.fn(async () => undefined)
    setApi(api)
    renderSetup()
    await userEvent.click(await screen.findByRole('button', { name: 'Cambiar cámara' }))
    await userEvent.click(screen.getByRole('button', { name: 'Guardar y probar' }))

    await waitFor(() => expect(api.cages.saveCamera).toHaveBeenCalledTimes(1))
    const [cageId, body] = vi.mocked(api.cages.saveCamera).mock.calls[0]
    expect(cageId).toBe('cage-1')
    expect(body).toEqual({
      type: 'RTSP',
      host: '192.168.1.60',
      port: 554,
      username: 'cuy',
      stream: 'stream2',
    })
    expect(body).not.toHaveProperty('password')
  })

  it('saves the phone with only its address and port, no username or password', async () => {
    const api = createMockApi(undefined, 0)
    api.cages.saveCamera = vi.fn(async () => undefined)
    setApi(api)
    renderSetup()
    await userEvent.click(await screen.findByRole('button', { name: 'Configurar cámara' }))
    await userEvent.click(screen.getByRole('radio', { name: 'Celular con IP Webcam' }))
    await userEvent.type(screen.getByLabelText('Dirección IP de la cámara'), '192.168.1.50')
    await userEvent.type(screen.getByLabelText('Puerto'), '8080')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar y probar' }))

    await waitFor(() => expect(api.cages.saveCamera).toHaveBeenCalledTimes(1))
    expect(vi.mocked(api.cages.saveCamera).mock.calls[0][1]).toEqual({
      type: 'PHONE',
      host: '192.168.1.50',
      port: 8080,
    })
  })

  it('asks for the password when none is saved yet', async () => {
    const api = createMockApi(undefined, 0)
    api.cages.saveCamera = vi.fn(async () => undefined)
    setApi(api)
    renderSetup()
    await userEvent.click(await screen.findByRole('button', { name: 'Configurar cámara' }))
    await userEvent.type(screen.getByLabelText('Dirección IP de la cámara'), '192.168.1.60')
    await userEvent.type(screen.getByLabelText('Usuario de la cámara'), 'cuy')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar y probar' }))

    expect(await screen.findByText('Escribe la contraseña de la cámara.')).toBeInTheDocument()
    expect(api.cages.saveCamera).not.toHaveBeenCalled()
  })

  it('never prefills the saved password', async () => {
    const api = createMockApi(undefined, 0)
    api.cages.getCamera = async () => SAVED_RTSP
    setApi(api)
    renderSetup()
    await userEvent.click(await screen.findByRole('button', { name: 'Cambiar cámara' }))

    expect(screen.getByLabelText('Contraseña de la cámara')).toHaveValue('')
    expect(screen.getByLabelText('Dirección IP de la cámara')).toHaveValue('192.168.1.60')
  })

  it('refuses an address outside the home network without calling the API', async () => {
    const api = createMockApi(undefined, 0)
    api.cages.saveCamera = vi.fn(async () => undefined)
    setApi(api)
    renderSetup()
    await userEvent.click(await screen.findByRole('button', { name: 'Configurar cámara' }))
    await userEvent.type(screen.getByLabelText('Dirección IP de la cámara'), '8.8.8.8')
    await userEvent.type(screen.getByLabelText('Usuario de la cámara'), 'cuy')
    await userEvent.type(screen.getByLabelText('Contraseña de la cámara'), 'secreta')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar y probar' }))

    expect(
      await screen.findByText(
        'Revisa los datos: la IP debe ser de tu red de casa (por ejemplo 192.168.1.60).',
      ),
    ).toBeInTheDocument()
    expect(api.cages.saveCamera).not.toHaveBeenCalled()
  })

  it.each([
    ['PENDING', 'Probando la cámara desde la laptop de la granja…'],
    ['CONNECTED', 'Cámara conectada.'],
    [
      'AUTH_FAILED',
      'La cámara rechazó el usuario o la contraseña. Revisa la cuenta de la cámara en la app Tapo.',
    ],
    ['OFFLINE', 'La laptop de la granja no responde. Revisa que esté encendida y con internet.'],
  ] as const)('shows the text of status %s', async (status, text) => {
    const api = createMockApi(undefined, 0)
    api.cages.getCamera = async () => ({ ...SAVED_RTSP, status, statusAt: null })
    setApi(api)
    renderSetup()

    expect(await screen.findByText(text)).toBeInTheDocument()
  })
})

describe('CameraSetup connecting progress', () => {
  let status: StationCamera['status']

  beforeEach(() => {
    // the clock only moves when a test advances it, so every step lands on an exact tick
    vi.useFakeTimers()
    status = 'PENDING'
    const api = createMockApi(undefined, 0)
    api.cages.getCamera = async () => ({ ...SAVED_RTSP, status, statusAt: null })
    setApi(api)
  })

  afterEach(() => vi.useRealTimers())

  // lets the query resolve and the component render, without moving the clock
  async function settle() {
    for (let i = 0; i < 10; i++) await act(() => vi.advanceTimersByTimeAsync(0))
  }
  const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms))
  // the data-state of each step of the progress list, in order
  const stepStates = () =>
    Array.from(document.querySelectorAll('li[data-state]')).map((li) => li.getAttribute('data-state'))

  it('walks through the steps on a timer and stops at the last one', async () => {
    renderSetup()
    await settle()

    expect(screen.getByText('Buscando la cámara en la red…', { selector: 'li' })).toBeInTheDocument()
    expect(stepStates()).toEqual(['current', 'pending', 'pending'])
    await advance(2_500)
    expect(stepStates()).toEqual(['done', 'current', 'pending'])
    await advance(2_500)
    expect(stepStates()).toEqual(['done', 'done', 'current'])
    await advance(2_000)
    expect(stepStates()).toEqual(['done', 'done', 'current'])
  })

  it('ends with every step checked and the success text when the camera connects', async () => {
    renderSetup()
    await settle()

    status = 'CONNECTED'
    // the status is asked again every 3 s: give it two rounds to land
    await advance(6_000)
    await settle()

    expect(screen.getByText('Listo, la cámara está conectada.')).toBeInTheDocument()
    expect(stepStates()).toEqual(['done', 'done', 'done'])
  })

  it('stops where it was and shows the error text when the camera cannot be reached', async () => {
    renderSetup()
    await settle()
    await advance(2_500)

    status = 'UNREACHABLE'
    await advance(3_000)
    await settle()

    expect(
      screen.getByText(
        'La laptop no encuentra la cámara. Revisa la IP y que ambas estén en el mismo wifi.',
      ),
    ).toBeInTheDocument()
    await advance(20_000)
    expect(stepStates()).not.toContain('current')
    expect(screen.queryByText('Listo, la cámara está conectada.')).not.toBeInTheDocument()
  })
})

describe('CameraSetup form autofill', () => {
  it('asks the browser not to autofill the camera username, and asks for a new password', async () => {
    const api = createMockApi(undefined, 0)
    api.cages.getCamera = async () => SAVED_RTSP
    setApi(api)
    renderSetup()
    await userEvent.click(await screen.findByRole('button', { name: 'Cambiar cámara' }))

    expect(screen.getByLabelText('Usuario de la cámara')).toHaveAttribute('autocomplete', 'off')
    expect(screen.getByLabelText('Contraseña de la cámara')).toHaveAttribute(
      'autocomplete',
      'new-password',
    )
  })
})
