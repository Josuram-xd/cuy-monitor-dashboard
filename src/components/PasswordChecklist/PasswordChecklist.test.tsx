import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PasswordChecklist } from './PasswordChecklist'

function item(name: RegExp) {
  return screen.getByText(name).closest('li') as HTMLElement
}

describe('PasswordChecklist', () => {
  it('lists the five main rules, all pending, before anything is typed', () => {
    render(<PasswordChecklist password="" />)

    expect(screen.getAllByRole('listitem')).toHaveLength(5)
    expect(within(item(/Entre 10 y 64/)).getByText('pendiente')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
  })

  it('ticks the rules as they are met and fills the bar', () => {
    render(<PasswordChecklist password="Abcdefghij" />)

    expect(within(item(/Entre 10 y 64/)).getByText('cumplido')).toBeInTheDocument()
    expect(within(item(/minúscula/)).getByText('cumplido')).toBeInTheDocument()
    expect(within(item(/mayúscula/)).getByText('cumplido')).toBeInTheDocument()
    expect(within(item(/Un número/)).getByText('pendiente')).toBeInTheDocument()
    expect(within(item(/carácter especial/)).getByText('pendiente')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '3')
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '3 de 5 requisitos')
  })

  it('everything is met with a good password', () => {
    render(<PasswordChecklist password="Cuyes-felices-9" username="juan" />)

    expect(screen.getAllByText('cumplido')).toHaveLength(5)
    expect(screen.queryByText('pendiente')).not.toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '5')
  })

  it('shows an extra rule only when it is the problem', () => {
    const { rerender } = render(<PasswordChecklist password="Cuyes-felices-9" />)
    expect(screen.queryByText(/Sin espacios/)).not.toBeInTheDocument()

    rerender(<PasswordChecklist password="Cuyes felices-9" />)
    expect(within(item(/Sin espacios/)).getByText('pendiente')).toBeInTheDocument()

    rerender(<PasswordChecklist password="Password123!" />)
    expect(screen.getByText(/contraseña muy común/)).toBeInTheDocument()

    rerender(<PasswordChecklist password="Mi-Juan-2026!!" username="juan" />)
    expect(screen.getByText(/No puede incluir tu usuario/)).toBeInTheDocument()
  })
})
