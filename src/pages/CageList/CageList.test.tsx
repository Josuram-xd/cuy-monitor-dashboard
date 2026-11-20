import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../api/ApiError'
import { getDashboardApi } from '../../api/apiProvider'
import { createMockApi } from '../../mocks/createMockApi'
import { MockDatabase } from '../../mocks/MockDatabase'
import { renderWithProviders } from '../../test/render'
import { selectDemoCages } from '../../hooks/useStartSimulation'
import { CageList } from './CageList'

vi.mock('../../api/apiProvider', () => ({ getDashboardApi: vi.fn() }))

function setup(db = new MockDatabase()) {
  const api = createMockApi(db, 0)
  vi.mocked(getDashboardApi).mockResolvedValue(api)
  renderWithProviders(<CageList />)
  return { api, db }
}

describe('CageList', () => {
  beforeEach(() => {
    vi.mocked(getDashboardApi).mockReset()
  })

  it('shows every cage with its status, its guinea pigs and a link to open it', async () => {
    setup()

    const list = await screen.findByRole('list', { name: 'Tus jaulas' })
    expect(within(list).getByText('Jaula piloto')).toBeInTheDocument()
    expect(within(list).getByText('Jaula del patio')).toBeInTheDocument()
    expect(await within(list).findByText(/4 cuyes/)).toBeInTheDocument()
    expect(within(list).getByText('2 cuyes')).toBeInTheDocument()
    expect(within(list).getByRole('link', { name: /Jaula del patio/ })).toHaveAttribute(
      'href',
      '/cages/cage-7f3a9c21',
    )
  })

  it('shows "Sin datos" when the status of a cage cannot be loaded, never "Normal"', async () => {
    const { api } = setup()
    vi.spyOn(api.cages, 'getHealth').mockRejectedValue(new ApiError(500, 'internal'))

    const list = await screen.findByRole('list', { name: 'Tus jaulas' })
    await waitFor(() => expect(within(list).getAllByText('Sin datos')).toHaveLength(2))
    expect(within(list).queryByText('Normal')).not.toBeInTheDocument()
  })

  it('creates a cage and shows it in the list', async () => {
    const user = userEvent.setup()
    const { db } = setup()
    await screen.findByRole('list', { name: 'Tus jaulas' })

    await user.click(screen.getByRole('button', { name: 'Nueva jaula' }))
    const dialog = screen.getByRole('dialog', { name: 'Nueva jaula' })
    await user.type(within(dialog).getByLabelText('Nombre'), '  Jaula grande ')
    await user.type(within(dialog).getByLabelText('Dónde está (opcional)'), 'Galpón 2')
    await user.click(within(dialog).getByRole('button', { name: 'Crear jaula' }))

    expect(await screen.findByText('Jaula grande')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(db.cages.at(-1)).toMatchObject({ name: 'Jaula grande', location: 'Galpón 2' })
    expect(db.cages.at(-1)?.cageId).toMatch(/^cage-[0-9a-f]{8}$/)
  })

  it('asks for a name before creating', async () => {
    const user = userEvent.setup()
    const { db } = setup()
    await screen.findByRole('list', { name: 'Tus jaulas' })

    await user.click(screen.getByRole('button', { name: 'Nueva jaula' }))
    await user.click(screen.getByRole('button', { name: 'Crear jaula' }))

    expect(screen.getByText('Escribe un nombre para la jaula')).toBeInTheDocument()
    expect(db.cages).toHaveLength(2)
  })

  it('renames a cage', async () => {
    const user = userEvent.setup()
    const { db } = setup()
    await screen.findByRole('list', { name: 'Tus jaulas' })

    await user.click(screen.getByRole('button', { name: 'Editar Jaula del patio' }))
    const name = within(screen.getByRole('dialog')).getByLabelText('Nombre')
    await user.clear(name)
    await user.type(name, 'Jaula del jardín')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByText('Jaula del jardín')).toBeInTheDocument()
    expect(db.cages[1].name).toBe('Jaula del jardín')
  })

  it('deletes a cage only after confirming', async () => {
    const user = userEvent.setup()
    const { db } = setup()
    await screen.findByRole('list', { name: 'Tus jaulas' })

    await user.click(screen.getByRole('button', { name: 'Eliminar Jaula del patio' }))
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(db.cages).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: 'Eliminar Jaula del patio' }))
    await user.click(screen.getByRole('button', { name: 'Eliminar jaula' }))

    await waitFor(() => expect(screen.queryByText('Jaula del patio')).not.toBeInTheDocument())
    expect(db.cages.map((c) => c.cageId)).toEqual(['cage-1'])
  })

  it('invites to create the first cage when there is none', async () => {
    const db = new MockDatabase()
    db.cages.length = 0
    setup(db)

    expect(
      await screen.findByText('Aún no tienes jaulas. Crea una para empezar a registrar tus cuyes.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Crear mi primera jaula' })).toBeInTheDocument()
  })

  it('includes critical and other available states within ten eligible cages', async () => {
    const api = createMockApi(new MockDatabase(), 0)
    const base = await api.cages.getHealth('cage-1')
    const normal = Array.from({ length: 14 }, (_, i) => ({
      ...base,
      cageId: String(i),
      status: 'NORMAL' as const,
    }))
    const ids = selectDemoCages([
      ...normal,
      { ...base, cageId: 'empty', guineaPigs: [], status: 'CRITICAL' },
      {
        ...base,
        cageId: 'hardware',
        monitoring: { connectedAt: base.updatedAt, lastBehaviorAt: null, lastAudioLabel: null },
      },
      { ...base, cageId: 'critical', status: 'CRITICAL' },
      { ...base, cageId: 'alert', status: 'ALERT' },
      { ...base, cageId: 'observed', status: 'OBSERVED' },
    ])
    expect(ids).toHaveLength(10)
    expect(ids).toEqual(expect.arrayContaining(['critical', 'alert', 'observed', '0']))
    expect(ids).not.toContain('empty')
    expect(ids).not.toContain('hardware')
  })

  it('connects the cage chosen on the home page', async () => {
    const { api, db } = setup()
    const connect = vi.spyOn(api.cages, 'setEquipment').mockResolvedValue()
    await userEvent.click(await screen.findByRole('button', { name: 'Conectar equipo' }))
    const dialog = within(await screen.findByRole('dialog'))
    await userEvent.selectOptions(dialog.getByRole('combobox'), db.cages[1].cageId)
    await userEvent.click(dialog.getByRole('button', { name: 'Conectar equipo' }))
    await waitFor(() => expect(connect).toHaveBeenCalledWith(db.cages[1].cageId, true))
  })

  it('starts the simulation in every cage at once after confirming', async () => {
    const user = userEvent.setup()
    const api = createMockApi(new MockDatabase(), 0)
    vi.mocked(getDashboardApi).mockResolvedValue(api)
    const start = vi.spyOn(api.cages, 'startSimulation')
    renderWithProviders(<CageList />)
    const cages = await api.cages.list()

    await user.click(await screen.findByRole('button', { name: 'Simular hasta 10 jaulas' }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Simular hasta 10 jaulas' }))

    await waitFor(() => expect(start).toHaveBeenCalledTimes(cages.length))
    expect(start.mock.calls.map(([id]) => id).sort()).toEqual(cages.map((c) => c.cageId).sort())
  })
})
