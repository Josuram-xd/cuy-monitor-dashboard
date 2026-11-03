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
import { shrinkToPhoto } from '../../utils/photo'
import { RegisterGuineaPig } from './RegisterGuineaPig'

vi.mock('../../api/apiProvider', () => ({ getDashboardApi: vi.fn() }))
// jsdom has no canvas, so the real shrinking cannot run here; utils/photo.test.ts covers its arithmetic
vi.mock('../../utils/photo', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../utils/photo')>()),
  shrinkToPhoto: vi.fn(),
}))

const PHOTO = {
  dataUrl: 'data:image/jpeg;base64,AAAA',
  base64: 'AAAA',
  contentType: 'image/jpeg',
}

function renderPage(api: DashboardApi) {
  vi.mocked(getDashboardApi).mockResolvedValue(api)
  renderWithProviders(
    <Routes>
      <Route path="/guinea-pigs/new" element={<RegisterGuineaPig />} />
      <Route path="/" element={<p>cage view</p>} />
    </Routes>,
    { route: '/guinea-pigs/new' },
  )
}

async function pickPhoto() {
  const file = new File(['not a real jpeg'], 'cuy.jpg', { type: 'image/jpeg' })
  await userEvent.upload(await screen.findByLabelText('Foto del cuy'), file)
}

describe('RegisterGuineaPig', () => {
  let db: MockDatabase
  let api: DashboardApi

  beforeEach(() => {
    db = new MockDatabase()
    api = createMockApi(db, 0)
    vi.mocked(shrinkToPhoto).mockResolvedValue(PHOTO)
  })

  it('shows which colors are already taken', async () => {
    renderPage(api)

    // the fake cage already has a cuy with the red, blue, white and orange marks
    expect(await screen.findByRole('radio', { name: /Rojo/ })).toBeDisabled()
    expect(screen.getAllByText('En uso')).toHaveLength(4)
    expect(screen.getByRole('radio', { name: /Verde/ })).toBeEnabled()
  })

  it('asks for the photo and the color before sending', async () => {
    const register = vi.spyOn(api.guineaPigs, 'register')
    renderPage(api)

    await userEvent.click(await screen.findByRole('button', { name: 'Registrar cuy' }))

    expect(
      await screen.findByText('La foto es obligatoria: es como reconoces al cuy.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Elige el color de la marca.')).toBeInTheDocument()
    expect(register).not.toHaveBeenCalled()
  })

  it('registers the guinea pig with its photo and goes back to the cage', async () => {
    const register = vi.spyOn(api.guineaPigs, 'register')
    renderPage(api)

    await pickPhoto()
    await userEvent.click(await screen.findByRole('radio', { name: /Verde/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Registrar cuy' }))

    expect(await screen.findByText('cage view')).toBeInTheDocument()
    expect(register).toHaveBeenCalledWith('cage-1', {
      photo: 'AAAA',
      photoContentType: 'image/jpeg',
      markColor: 'GREEN',
    })
    expect(db.guineaPigs.find((g) => g.markColor === 'GREEN')).toMatchObject({
      photoUrl: 'data:image/jpeg;base64,AAAA',
      status: 'NORMAL',
    })
  })

  it('says so when the file cannot be used as a photo', async () => {
    vi.mocked(shrinkToPhoto).mockRejectedValue(new Error('the file is not an image'))
    renderPage(api)

    await pickPhoto()

    expect(
      await screen.findByText('No pudimos usar ese archivo. Elige una foto JPG, PNG o WebP.'),
    ).toBeInTheDocument()
  })

  it('says so when someone took the color in the meantime', async () => {
    vi.spyOn(api.guineaPigs, 'register').mockRejectedValue(new ApiError(409, 'conflict'))
    renderPage(api)

    await pickPhoto()
    await userEvent.click(await screen.findByRole('radio', { name: /Verde/ }))
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

    await pickPhoto()
    await userEvent.click(await screen.findByRole('button', { name: 'Teddy' }))
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

  it('keeps them optional: a cuy can be registered with only a photo and a color', async () => {
    renderPage(api)

    await pickPhoto()
    await userEvent.click(await screen.findByRole('radio', { name: /Verde/ }))
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

    await pickPhoto()
    await userEvent.click(await screen.findByRole('radio', { name: /Verde/ }))
    await userEvent.type(screen.getByLabelText(/Peso al llegar/), '5')
    await userEvent.click(screen.getByRole('button', { name: 'Registrar cuy' }))

    expect(await screen.findByText('Escribe un peso entre 50 y 2000 g.')).toBeInTheDocument()
    expect(register).not.toHaveBeenCalled()
  })

  it('shows the preview growing with what is chosen', async () => {
    renderPage(api)

    const preview = await screen.findByRole('complementary', { name: 'Así se verá' })
    expect(within(preview).getByText('Elige el color de su marca')).toBeInTheDocument()

    await pickPhoto()
    await userEvent.click(screen.getByRole('button', { name: 'Abisinio' }))
    await userEvent.type(screen.getByLabelText(/Peso al llegar/), '900')
    await userEvent.click(screen.getByRole('radio', { name: /Verde/ }))

    expect(within(preview).getByAltText('Foto del cuy que estás registrando')).toHaveAttribute(
      'src',
      PHOTO.dataUrl,
    )
    expect(within(preview).getByText('Verde')).toBeInTheDocument()
    expect(within(preview).getByText('Abisinio')).toBeInTheDocument()
    expect(within(preview).getByText('900 g')).toBeInTheDocument()
  })
})
