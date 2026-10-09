import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../api/ApiError'
import { getDashboardApi } from '../../api/apiProvider'
import type { DashboardApi } from '../../api/DashboardApi'
import { createMockApi } from '../../mocks/createMockApi'
import { MockDatabase } from '../../mocks/MockDatabase'
import { renderWithProviders } from '../../test/render'
import { DeleteGuineaPig } from './DeleteGuineaPig'

vi.mock('../../api/apiProvider', () => ({ getDashboardApi: vi.fn() }))

describe('DeleteGuineaPig', () => {
  let db: MockDatabase
  let api: DashboardApi

  beforeEach(() => {
    db = new MockDatabase()
    api = createMockApi(db, 0)
    vi.mocked(getDashboardApi).mockResolvedValue(api)
  })

  function renderButton() {
    renderWithProviders(<DeleteGuineaPig guineaPig={db.guineaPigs[0]} />)
  }

  it('asks first and does not delete until it is confirmed', async () => {
    const remove = vi.spyOn(api.guineaPigs, 'remove')
    renderButton()

    await userEvent.click(screen.getByRole('button', { name: 'Eliminar a Canela' }))

    const dialog = screen.getByRole('dialog', { name: '¿Eliminar a Canela?' })
    expect(within(dialog).getByText(/Su historial se conserva/)).toBeInTheDocument()
    expect(remove).not.toHaveBeenCalled()
  })

  it('cancelling leaves the cuy where it is', async () => {
    renderButton()

    await userEvent.click(screen.getByRole('button', { name: 'Eliminar a Canela' }))
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar' }),
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(db.guineaPigs.some((g) => g.name === 'Canela')).toBe(true)
  })

  it('deletes it once confirmed and closes the dialog', async () => {
    renderButton()

    await userEvent.click(screen.getByRole('button', { name: 'Eliminar a Canela' }))
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Sí, eliminar' }),
    )

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(db.guineaPigs.some((g) => g.name === 'Canela')).toBe(false)
  })

  it('says so when it is already gone', async () => {
    vi.spyOn(api.guineaPigs, 'remove').mockRejectedValue(new ApiError(404, 'not_found'))
    renderButton()

    await userEvent.click(screen.getByRole('button', { name: 'Eliminar a Canela' }))
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Sí, eliminar' }),
    )

    expect(
      await screen.findByText('Este cuy ya no existe. Actualiza la página.'),
    ).toBeInTheDocument()
  })
})
