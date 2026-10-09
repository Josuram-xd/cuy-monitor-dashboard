import { ApiError } from './ApiError'

// where the error happened: the same 401 means "wrong password" on login and "wrong code" on verify
export type ErrorContext =
  'login' | 'register' | 'verify' | 'account' | 'google' | 'guineaPig' | 'general'

// Maps a failed call to an es.json key. The backend message is never shown as is.
export function errorMessageKey(error: unknown, context: ErrorContext = 'general'): string {
  if (!(error instanceof ApiError)) {
    return 'errors.generic'
  }
  if (error.isNetworkError) {
    return 'errors.network'
  }
  if (error.isUnauthorized && context === 'login') {
    return 'auth.error.invalidCredentials'
  }
  if (error.isUnauthorized && context === 'verify') {
    return 'auth.error.invalidCode'
  }
  if (context === 'google' && error.status === 404) {
    return 'auth.error.googleOff'
  }
  if (context === 'google' && (error.isUnauthorized || error.status === 400)) {
    return 'auth.error.googleFailed'
  }
  if (error.isUnauthorized && context === 'account') {
    return 'account.error.wrongPassword'
  }
  if (error.status === 400 && context === 'account' && 'password' in error.fields) {
    return 'auth.error.weakPassword'
  }
  if (error.status === 404 && context === 'guineaPig') {
    return 'guineaPig.error.alreadyGone'
  }
  if (error.status === 409 && context === 'guineaPig') {
    return 'guineaPig.error.colorTaken'
  }
  if (error.status === 409 && context === 'register') {
    return 'auth.error.userExists'
  }
  if (error.status === 400 && context === 'register' && 'password' in error.fields) {
    return 'auth.error.weakPassword'
  }
  if (error.status === 400) {
    return 'errors.invalidData'
  }
  return 'errors.generic'
}
