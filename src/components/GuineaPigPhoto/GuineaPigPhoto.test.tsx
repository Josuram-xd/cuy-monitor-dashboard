import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GuineaPigPhoto } from './GuineaPigPhoto'

describe('GuineaPigPhoto', () => {
  it('shows the photo with what it shows', () => {
    render(
      <GuineaPigPhoto
        photoUrl="/api/v1/cages/cage-1/guinea-pigs/1/photo"
        alt="Foto de Cuy Rojo"
        size={96}
      />,
    )

    expect(screen.getByRole('img', { name: 'Foto de Cuy Rojo' })).toHaveAttribute(
      'src',
      '/api/v1/cages/cage-1/guinea-pigs/1/photo',
    )
  })

  it('draws a placeholder for a cuy without photo, or when the photo does not load', () => {
    const { rerender } = render(<GuineaPigPhoto photoUrl={null} alt="Foto de Cuy Rojo" size={96} />)
    expect(screen.getByRole('img', { name: 'Foto de Cuy Rojo' }).tagName).toBe('SPAN')

    rerender(<GuineaPigPhoto photoUrl="/broken" alt="Foto de Cuy Rojo" size={96} />)
    fireEvent.error(screen.getByRole('img', { name: 'Foto de Cuy Rojo' }))
    expect(screen.getByRole('img', { name: 'Foto de Cuy Rojo' }).tagName).toBe('SPAN')
  })
})
