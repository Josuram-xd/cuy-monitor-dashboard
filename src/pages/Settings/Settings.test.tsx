import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { changeLanguage } from '../../i18n'
import { PreferencesProvider } from '../../preferences/PreferencesProvider'
import { renderWithProviders } from '../../test/render'
import { Settings } from './Settings'

function renderSettings() {
  renderWithProviders(
    <PreferencesProvider>
      <Settings />
    </PreferencesProvider>,
  )
}

describe('Settings', () => {
  afterEach(async () => {
    await changeLanguage('es')
    delete document.documentElement.dataset.theme
    localStorage.setItem(
      'cuy-monitor.preferences',
      JSON.stringify({ language: 'es', theme: 'system' }),
    )
  })

  it('shows the preferences with the current choice selected', () => {
    renderSettings()

    expect(screen.getByRole('heading', { name: 'Ajustes' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Español' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Como el dispositivo' })).toBeChecked()
  })

  it('switches the whole page to English and remembers it', async () => {
    const user = userEvent.setup()
    renderSettings()

    await user.click(screen.getByRole('radio', { name: 'English' }))

    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('en')
    expect(JSON.parse(localStorage.getItem('cuy-monitor.preferences') ?? '{}')).toMatchObject({
      language: 'en',
    })
  })

  it('turns dark mode on and off', async () => {
    const user = userEvent.setup()
    renderSettings()

    await user.click(screen.getByRole('radio', { name: 'Oscuro' }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(screen.getByRole('radio', { name: 'Oscuro' })).toBeChecked()

    await user.click(screen.getByRole('radio', { name: 'Claro' }))
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('moves between the options with the arrow keys', async () => {
    const user = userEvent.setup()
    renderSettings()

    screen.getByRole('radio', { name: 'Como el dispositivo' }).focus()
    await user.keyboard('{ArrowRight}')

    expect(screen.getByRole('radio', { name: 'Claro' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Claro' })).toHaveFocus()
  })
})
