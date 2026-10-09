// The fake "cookie": real cookies survive a reload, and so does this flag. Mocks only, never in production.
const KEY = 'cuy.mock.session'

function storage(): Storage | null {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

export const mockSession = {
  has: (): boolean => storage()?.getItem(KEY) === '1',
  start: (): void => storage()?.setItem(KEY, '1'),
  end: (): void => storage()?.removeItem(KEY),
}
