import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../api/ApiError'
import { getDashboardApi } from '../../api/apiProvider'
import type { DashboardApi } from '../../api/DashboardApi'
import { catalogOptions } from '../../catalog/catalog'
import { createMockApi } from '../../mocks/createMockApi'
import { MockDatabase } from '../../mocks/MockDatabase'
import { renderWithProviders } from '../../test/render'
import { PhotoProblem, type PreparedPhoto } from '../../utils/photo'
import { RegisterGuineaPig } from './RegisterGuineaPig'

vi.mock('../../api/apiProvider', () => ({ getDashboardApi: vi.fn() }))

// jsdom has no canvas: the shrinking is replaced by a fixed small JPEG
const PHOTO: PreparedPhoto = {
  base64: '/9j/4AAQSkZJRg==',
  contentType: 'image/jpeg',
  dataUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
}

function renderPage(api: DashboardApi, prepare = vi.fn(async () => PHOTO)) {
  vi.mocked(getDashboardApi).mockResolvedValue(api)
  renderWithProviders(
    <Routes>
      <Route
        path="/cages/:cageId/guinea-pigs/new"
        element={<RegisterGuineaPig preparePhoto={prepare} />}
      />
      <Route path="/cages/:cageId" element={<p>cage view</p>} />
    </Routes>,
    { route: '/cages/cage-1/guinea-pigs/new' },
  )
  return prepare
}

async function addPhoto() {
  const file = new File(['jpeg bytes'], 'cuy.jpg', { type: 'image/jpeg' })
  await userEvent.upload(await screen.findByLabelText('Foto del cuy'), file)
}

describe('RegisterGuineaPig', () => {
  let db: MockDatabase
  let api: DashboardApi

  beforeEach(() => {
    db = new MockDatabase()
    api = createMockApi(db, 0)
  })

  it('has no name field: a cuy is registered with its photo', async () => {
    renderPage(api)

    expect(await screen.findByLabelText('Foto del cuy')).toBeInTheDocument()
    expect(screen.queryByLabelText('Nombre')).not.toBeInTheDocument()
  })

  it('shows which colors are already taken', async () => {
    renderPage(api)

    // the fake cage has RED, BLUE, WHITE and ORANGE
    expect(await screen.findByRole('radio', { name: /Rojo/ })).toBeDisabled()
    expect(screen.getAllByText('En uso')).toHaveLength(4)
    expect(screen.getByRole('radio', { name: /Verde/ })).toBeEnabled()
  })

  it('asks for the photo and the color before sending', async () => {
    const register = vi.spyOn(api.guineaPigs, 'register')
    renderPage(api)

    await userEvent.click(await screen.findByRole('button', { name: 'Registrar cuy' }))

    expect(await screen.findByText('Agrega una foto del cuy.')).toBeInTheDocument()
    expect(screen.getByText('Elige el color de la marca.')).toBeInTheDocument()
    expect(register).not.toHaveBeenCalled()
  })

  it('sends the photo as the backend wants it and goes back to the cage', async () => {
    const register = vi.spyOn(api.guineaPigs, 'register')
    const prepare = renderPage(api)

    await addPhoto()
    await userEvent.click(screen.getByRole('radio', { name: /Verde/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Registrar cuy' }))

    expect(await screen.findByText('cage view')).toBeInTheDocument()
    expect(prepare).toHaveBeenCalledOnce()
    expect(register).toHaveBeenCalledWith('cage-1', {
      photo: PHOTO.base64,
      photoContentType: 'image/jpeg',
      markColor: 'GREEN',
    })
    expect(db.guineaPigs.find((g) => g.markColor === 'GREEN')).toMatchObject({
      status: 'NORMAL',
      photoUrl: PHOTO.dataUrl,
    })
  })

  it('says why a photo cannot be used', async () => {
    renderPage(
      api,
      vi.fn(async () => {
        throw new PhotoProblem('type')
      }),
    )

    await addPhoto()

    expect(
      await screen.findByText('Esa imagen no sirve: usa una foto JPG, PNG o WebP.'),
    ).toBeInTheDocument()
  })

  it('says so when someone took the color in the meantime', async () => {
    vi.spyOn(api.guineaPigs, 'register').mockRejectedValue(new ApiError(409, 'conflict'))
    renderPage(api)

    await addPhoto()
    await userEvent.click(screen.getByRole('radio', { name: /Verde/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Registrar cuy' }))

    expect(
      await screen.findByText('Otro cuy ya lleva ese color. Elige uno libre.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('cage view')).not.toBeInTheDocument()
  })

  it('says there is no color left when the cage already has one of each', async () => {
    db.guineaPigs.length = 0
    catalogOptions('markColors').forEach(({ code }, index) =>
      db.guineaPigs.push({
        id: index + 1,
        photoUrl: null,
        markColor: code,
        status: 'NORMAL',
        statusSince: new Date().toISOString(),
      }),
    )
    renderPage(api)

    expect(await screen.findByText(/Ya hay un cuy con cada color/)).toBeInTheDocument()
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
  })

  it('sends the breed, coat, weight and notes when they are filled', async () => {
    renderPage(api)

    await addPhoto()
    await userEvent.click(screen.getByRole('button', { name: 'Teddy' }))
    await userEvent.click(screen.getByRole('button', { name: 'Crema' }))
    await userEvent.type(screen.getByLabelText(/Peso al llegar/), '875')
    await userEvent.type(screen.getByLabelText('Notas'), '  Come mucha zanahoria ')
    await userEvent.click(screen.getByRole('radio', { name: /Verde/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Registrar cuy' }))

    expect(await screen.findByText('cage view')).toBeInTheDocument()
    expect(db.guineaPigs.find((g) => g.markColor === 'GREEN')).toMatchObject({
      breed: 'TEDDY',
      coatColor: 'CREAM',
      initialWeightGrams: 875,
      notes: 'Come mucha zanahoria',
    })
  })

  it('keeps the rest optional: the photo and the color are enough', async () => {
    renderPage(api)

    await addPhoto()
    await userEvent.click(screen.getByRole('radio', { name: /Verde/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Registrar cuy' }))

    expect(await screen.findByText('cage view')).toBeInTheDocument()
    expect(db.guineaPigs.find((g) => g.markColor === 'GREEN')).toMatchObject({
      breed: null,
      initialWeightGrams: null,
    })
  })

  it('does not send a weight outside the limits', async () => {
    const register = vi.spyOn(api.guineaPigs, 'register')
    renderPage(api)

    await addPhoto()
    await userEvent.click(screen.getByRole('radio', { name: /Verde/ }))
    await userEvent.type(screen.getByLabelText(/Peso al llegar/), '5')
    await userEvent.click(screen.getByRole('button', { name: 'Registrar cuy' }))

    expect(await screen.findByText('Escribe un peso entre 50 y 2000 g.')).toBeInTheDocument()
    expect(register).not.toHaveBeenCalled()
  })

  it('shows the preview growing with what is chosen', async () => {
    renderPage(api)

    const preview = await screen.findByRole('complementary', { name: 'Así se verá' })
    expect(within(preview).getByText('Elige su marca')).toBeInTheDocument()

    await addPhoto()
    await userEvent.click(screen.getByRole('radio', { name: /Verde/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Abisinio' }))
    await userEvent.type(screen.getByLabelText(/Peso al llegar/), '900')

    expect(within(preview).getByText('Cuy Verde')).toBeInTheDocument()
    expect(within(preview).getByText('Abisinio')).toBeInTheDocument()
    expect(within(preview).getByText('900 g')).toBeInTheDocument()
    expect(preview.querySelector('img')).toHaveAttribute('src', PHOTO.dataUrl)
  })
})
