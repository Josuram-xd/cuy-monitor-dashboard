import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { BottomNav } from './BottomNav'

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <BottomNav />
    </MemoryRouter>,
  )
}

const current = () =>
  screen
    .getAllByRole('link')
    .filter((link) => link.getAttribute('aria-current') === 'page')
    .map((link) => link.textContent)

describe('BottomNav', () => {
  it('lights "Jaulas" on the list of cages and inside a cage', () => {
    renderAt('/')
    expect(current()).toEqual(['Jaulas'])
  })

  it('keeps "Jaulas" lit on every page of a cage', () => {
    renderAt('/cages/cage-1/guinea-pigs/3')
    expect(current()).toEqual(['Jaulas'])
  })

  it('lights only one tab at a time', () => {
    renderAt('/alerts')
    expect(current()).toEqual(['Alertas'])
  })

  it('lights no tab on a page that has none', () => {
    renderAt('/settings')
    expect(current()).toEqual([])
  })
})
