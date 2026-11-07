// Task 11.3: the data hooks against the mock API. Each test checks what the hook asks for and, for
// the mutations, which parts of the cache it refreshes afterwards.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getDashboardApi } from '../api/apiProvider'
import type { DashboardApi } from '../api/DashboardApi'
import { createMockApi } from '../mocks/createMockApi'
import { mockCageId } from '../mocks/data'
import { mockSession } from '../mocks/mockSession'
import { useAlertHistory } from './useAlertHistory'
import { useAlerts } from './useAlerts'
import { useCageHealth } from './useCageHealth'
import { cagePath, useCageId } from './useCageId'
import { useCage, useCages, useCreateCage, useDeleteCage, useUpdateCage } from './useCages'
import { useCopyToClipboard } from './useCopyToClipboard'
import { useDeleteGuineaPig } from './useDeleteGuineaPig'
import { useGuineaPigs, useGuineaPigsOfCages } from './useGuineaPigs'
import { useMarkAlertReviewed } from './useMarkAlertReviewed'
import { useNow } from './useNow'
import { useProfile } from './useProfile'
import { useUpdateProfileMutation } from './useAccountMutations'
import { queryKeys } from './queryKeys'

vi.mock('../api/apiProvider', () => ({ getDashboardApi: vi.fn() }))

let api: DashboardApi
let queryClient: QueryClient

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

function invalidated() {
  return vi.spyOn(queryClient, 'invalidateQueries')
}

beforeEach(() => {
  api = createMockApi(undefined, 0)
  vi.mocked(getDashboardApi).mockResolvedValue(api)
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('cage hooks', () => {
  it('list the cages of the account and read one of them', async () => {
    const cages = renderHook(() => useCages(), { wrapper })
    await waitFor(() => expect(cages.result.current.isSuccess).toBe(true))
    expect(cages.result.current.data?.map((c) => c.cageId)).toContain(mockCageId)

    const cage = renderHook(() => useCage(mockCageId), { wrapper })
    await waitFor(() => expect(cage.result.current.data?.cageId).toBe(mockCageId))
  })

  it('creating, renaming and deleting a cage refresh the list (and its alerts when deleted)', async () => {
    const spy = invalidated()
    const create = renderHook(() => useCreateCage(), { wrapper })
    let created = ''
    await act(async () => {
      created = (await create.result.current.mutateAsync({ name: 'Patio', location: '' })).cageId
    })
    expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.cages })

    const update = renderHook(() => useUpdateCage(created), { wrapper })
    await act(() => update.result.current.mutateAsync({ name: 'Patio 2', location: '' }))
    expect(spy).toHaveBeenCalledWith({ queryKey: ['cage', created] })

    const remove = renderHook(() => useDeleteCage(), { wrapper })
    await act(() => remove.result.current.mutateAsync(created))
    expect(spy).toHaveBeenCalledWith({ queryKey: ['alerts'] })
  })

  it('reads the health of a cage', async () => {
    const health = renderHook(() => useCageHealth(mockCageId), { wrapper })
    await waitFor(() => expect(health.result.current.data?.cageId).toBe(mockCageId))
    expect(health.result.current.data?.status).toBeTruthy()
  })
})

describe('guinea pig hooks', () => {
  it('list the guinea pigs of one cage and of several at once', async () => {
    const one = renderHook(() => useGuineaPigs(mockCageId), { wrapper })
    await waitFor(() => expect(one.result.current.isSuccess).toBe(true))
    const count = one.result.current.data!.length
    expect(count).toBeGreaterThan(0)

    const many = renderHook(() => useGuineaPigsOfCages([mockCageId]), { wrapper })
    await waitFor(() => expect(many.result.current).toHaveLength(count))
  })

  it('deleting a guinea pig refreshes its cage and the alerts', async () => {
    const [first] = await api.guineaPigs.list(mockCageId)
    const spy = invalidated()
    const remove = renderHook(() => useDeleteGuineaPig(mockCageId), { wrapper })

    await act(() => remove.result.current.mutateAsync(first.id))

    expect(spy).toHaveBeenCalledWith({ queryKey: ['cage', mockCageId] })
    expect(spy).toHaveBeenCalledWith({ queryKey: ['alerts'] })
    expect((await api.guineaPigs.list(mockCageId)).map((g) => g.id)).not.toContain(first.id)
  })
})

describe('alert hooks', () => {
  it('list the open alerts, of every cage or of one', async () => {
    const all = renderHook(() => useAlerts('OPEN'), { wrapper })
    await waitFor(() => expect(all.result.current.isSuccess).toBe(true))
    expect(all.result.current.data!.every((a) => a.status === 'OPEN')).toBe(true)

    const one = renderHook(() => useAlerts('OPEN', mockCageId), { wrapper })
    await waitFor(() => expect(one.result.current.isSuccess).toBe(true))
    expect(one.result.current.data!.every((a) => a.cageId === mockCageId)).toBe(true)
  })

  it('reviewing an alert refreshes the alerts and the cage it belongs to', async () => {
    const [open] = await api.alerts.list('OPEN')
    const spy = invalidated()
    const review = renderHook(() => useMarkAlertReviewed(), { wrapper })

    await act(() => review.result.current.mutateAsync(open.id))

    expect(spy).toHaveBeenCalledWith({ queryKey: ['alerts'] })
    expect(spy).toHaveBeenCalledWith({ queryKey: ['cage', open.cageId] })
  })

  it('pages the history and knows when there is no next page', async () => {
    const to = new Date().toISOString()
    const from = new Date(Date.now() - 30 * 24 * 3600_000).toISOString()
    const history = renderHook(() => useAlertHistory({ cageId: mockCageId, from, to }), { wrapper })
    await waitFor(() => expect(history.result.current.isSuccess).toBe(true))
    const first = history.result.current.data!.pages[0]
    expect(first.page).toBe(0)

    if (first.hasNext) {
      await act(() => history.result.current.fetchNextPage())
      await waitFor(() => expect(history.result.current.data?.pages[1]?.page).toBe(1))
    } else {
      expect(history.result.current.hasNextPage).toBe(false)
    }
  })
})

describe('account hooks', () => {
  it('reads the profile and keeps the cache in step after renaming', async () => {
    // the mock answers the profile only with a session, like the backend
    mockSession.start()
    const profile = renderHook(() => useProfile(), { wrapper })
    await waitFor(() => expect(profile.result.current.isSuccess).toBe(true))

    const rename = renderHook(() => useUpdateProfileMutation(), { wrapper })
    await act(() => rename.result.current.mutateAsync({ fullName: 'Rosa Quispe' }))

    expect(queryClient.getQueryData(queryKeys.profile)).toMatchObject({ fullName: 'Rosa Quispe' })
  })
})

describe('small hooks', () => {
  it('useCageId reads the cage of the route, and refuses outside one', () => {
    const inCage = renderHook(() => useCageId(), {
      wrapper: ({ children }) => (
        <MemoryRouter initialEntries={['/cages/cage-9']}>
          <Routes>
            <Route path="/cages/:cageId" element={children} />
          </Routes>
        </MemoryRouter>
      ),
    })
    expect(inCage.result.current).toBe('cage-9')
    expect(cagePath('cage 1', '/alerts')).toBe('/cages/cage%201/alerts')

    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() =>
      renderHook(() => useCageId(), {
        wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>,
      }),
    ).toThrow(/cages\/:cageId/)
  })

  it('useNow ticks', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-06T10:00:00Z'))
    const now = renderHook(() => useNow(1000))
    const start = now.result.current

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(now.result.current - start).toBe(3000)
  })

  it('useCopyToClipboard says "copied" for a moment, and stays quiet without a clipboard', async () => {
    vi.useFakeTimers()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    const copy = renderHook(() => useCopyToClipboard())

    await act(() => copy.result.current.copy('cage-1'))
    expect(writeText).toHaveBeenCalledWith('cage-1')
    expect(copy.result.current.copied).toBe(true)
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(copy.result.current.copied).toBe(false)

    writeText.mockRejectedValueOnce(new Error('denied'))
    await act(() => copy.result.current.copy('cage-1'))
    expect(copy.result.current.copied).toBe(false)
  })
})
