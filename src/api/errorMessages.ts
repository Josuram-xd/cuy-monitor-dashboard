import { ApiError } from './ApiError'

// where the error happened: the same 401 means "wrong password" on login and "wrong code" on verify
export type ErrorContext =
  | 'login'
  | 'register'
  | 'verify'
  | 'account'
  | 'google'
  | 'guineaPig'
  | 'cage'
  | 'assistant'
  | 'general'

// Chain of Responsibility: each rule returns a key if it handles the error, or undefined to pass it on. Order matters.
type ErrorRule = (error: ApiError, context: ErrorContext) => string | undefined

const RULES: readonly ErrorRule[] = [
  (e) => (e.isNetworkError ? 'errors.network' : undefined),
  (e, c) => (e.isUnauthorized && c === 'login' ? 'auth.error.invalidCredentials' : undefined),
  (e, c) => (e.isUnauthorized && c === 'verify' ? 'auth.error.invalidCode' : undefined),
  (e, c) => (c === 'google' && e.status === 404 ? 'auth.error.googleOff' : undefined),
  (e, c) =>
    c === 'google' && (e.isUnauthorized || e.status === 400)
      ? 'auth.error.googleFailed'
      : undefined,
  (e, c) => (e.isUnauthorized && c === 'account' ? 'account.error.wrongPassword' : undefined),
  (e, c) =>
    e.status === 400 && c === 'account' && 'password' in e.fields
      ? 'auth.error.weakPassword'
      : undefined,
  (e, c) => (e.status === 404 && c === 'guineaPig' ? 'guineaPig.error.alreadyGone' : undefined),
  (e, c) => (e.status === 409 && c === 'guineaPig' ? 'guineaPig.error.colorTaken' : undefined),
  (e, c) => (e.status === 404 && c === 'cage' ? 'cages.error.alreadyGone' : undefined),
  (e, c) => (c === 'assistant' && e.status === 429 ? 'assistant.error.tooMany' : undefined),
  (e, c) => (c === 'assistant' && e.status === 503 ? 'assistant.error.unavailable' : undefined),
  // the cage access proxy of the backend refused it: it is another account's cage
  (e) => (e.status === 403 ? 'errors.forbidden' : undefined),
  (e, c) => (e.status === 409 && c === 'register' ? 'auth.error.userExists' : undefined),
  (e, c) =>
    e.status === 400 && c === 'register' && 'password' in e.fields
      ? 'auth.error.weakPassword'
      : undefined,
  (e) => (e.status === 429 ? 'errors.tooManyRequests' : undefined),
  (e) => (e.status === 400 ? 'errors.invalidData' : undefined),
]

// Maps a failed call to an es.json key. The backend message is never shown as is.
export function errorMessageKey(error: unknown, context: ErrorContext = 'general'): string {
  if (!(error instanceof ApiError)) {
    return 'errors.generic'
  }
  for (const rule of RULES) {
    const key = rule(error, context)
    if (key) return key
  }
  return 'errors.generic'
}
