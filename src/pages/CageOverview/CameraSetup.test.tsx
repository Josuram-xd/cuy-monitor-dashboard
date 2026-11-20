import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
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
