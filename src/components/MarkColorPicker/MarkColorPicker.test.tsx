import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MarkColorPicker } from './MarkColorPicker'

describe('MarkColorPicker', () => {
  it('offers the eight colors, each with its name', () => {
    render(<MarkColorPicker legend="Color de la marca" value={null} onChange={() => {}} />)

    expect(screen.getAllByRole('radio')).toHaveLength(8)
    expect(screen.getByRole('radio', { name: /Rojo/ })).toBeEnabled()
    expect(screen.getByRole('group', { name: 'Color de la marca' })).toBeInTheDocument()
  })

  it('disables a color that another guinea pig already wears and says whose it is', () => {
    render(
      <MarkColorPicker
        legend="Color de la marca"
        value={null}
        onChange={() => {}}
        usedBy={{ RED: 'Canela' }}
      />,
    )

    expect(screen.getByRole('radio', { name: /Rojo/ })).toBeDisabled()
    expect(screen.getByText('Lo lleva Canela')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Azul/ })).toBeEnabled()
  })

  it('reports the chosen color and marks it as selected', async () => {
    const onChange = vi.fn()
    render(<MarkColorPicker legend="Color de la marca" value="BLUE" onChange={onChange} />)
    expect(screen.getByRole('radio', { name: /Azul/ })).toBeChecked()

    await userEvent.click(screen.getByRole('radio', { name: /Verde/ }))

    expect(onChange).toHaveBeenCalledWith('GREEN')
  })

  it('does not let a taken color be chosen', async () => {
    const onChange = vi.fn()
    render(
      <MarkColorPicker
        legend="Color de la marca"
        value={null}
        onChange={onChange}
        usedBy={{ RED: 'Canela' }}
      />,
    )

    await userEvent.click(screen.getByRole('radio', { name: /Rojo/ }))

    expect(onChange).not.toHaveBeenCalled()
  })

  it('shows the error to screen readers', () => {
    render(
      <MarkColorPicker
        legend="Color de la marca"
        value={null}
        onChange={() => {}}
        error="Elige el color de la marca."
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Elige el color de la marca.')
  })
})
