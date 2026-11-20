import { act, fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../test/render'
import { LiveSnapshot } from './LiveSnapshot'

describe('LiveSnapshot', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('shows the last picture of the cage', () => {
    renderWithProviders(<LiveSnapshot cageId="cage-1" />)

    const image = screen.getByRole('img', { name: 'Imagen de la cámara' })
    expect(image).toHaveAttribute('src', '/api/v1/cages/cage-1/camera/latest?t=0')
  })

  it('asks for a new picture every 3 seconds while the page is visible', () => {
    renderWithProviders(<LiveSnapshot cageId="cage-1" />)

    act(() => {
      vi.advanceTimersByTime(3_000)
    })

    expect(screen.getByRole('img', { name: 'Imagen de la cámara' })).toHaveAttribute(
      'src',
      '/api/v1/cages/cage-1/camera/latest?t=1',
    )
  })

  it('does not ask while the page is in the background', () => {
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    renderWithProviders(<LiveSnapshot cageId="cage-1" />)

    act(() => {
      vi.advanceTimersByTime(9_000)
    })

    expect(screen.getByRole('img', { name: 'Imagen de la cámara' })).toHaveAttribute(
      'src',
      '/api/v1/cages/cage-1/camera/latest?t=0',
    )
  })

  it('says there is no picture yet when it fails to load, and tries again later', () => {
    renderWithProviders(<LiveSnapshot cageId="cage-1" />)

    fireEvent.error(screen.getByRole('img', { name: 'Imagen de la cámara' }))
    expect(screen.getByText('Todavía no llega imagen de la cámara')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(3_000)
    })
    expect(screen.getByRole('img', { name: 'Imagen de la cámara' })).toHaveAttribute(
      'src',
      '/api/v1/cages/cage-1/camera/latest?t=1',
    )
  })
})
