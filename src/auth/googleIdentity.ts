// Google Identity Services (GIS): the official script that draws "Continuar con Google" and hands
// back an ID token. The page never sees the user's Google password; the backend verifies the token.
const SCRIPT_URL = 'https://accounts.google.com/gsi/client'

interface CredentialResponse {
  credential?: string
}

export interface GoogleAccountsId {
  initialize: (options: {
    client_id: string
    callback: (response: CredentialResponse) => void
    ux_mode?: 'popup' | 'redirect'
  }) => void
  renderButton: (
    parent: HTMLElement,
    options: {
      type?: 'standard' | 'icon'
      theme?: 'outline' | 'filled_blue' | 'filled_black'
      size?: 'large' | 'medium' | 'small'
      text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
      shape?: 'rectangular' | 'pill'
      width?: number
      locale?: string
    },
  ) => void
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } }
  }
}

let loading: Promise<GoogleAccountsId> | null = null

// one <script> for the whole app; a failed load can be retried
export function loadGoogleIdentity(): Promise<GoogleAccountsId> {
  if (window.google?.accounts.id) {
    return Promise.resolve(window.google.accounts.id)
  }
  loading ??= new Promise<GoogleAccountsId>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.async = true
    script.onload = () => {
      const api = window.google?.accounts.id
      if (api) {
        resolve(api)
      } else {
        reject(new Error('google identity unavailable'))
      }
    }
    script.onerror = () => reject(new Error('google identity could not load'))
    document.head.appendChild(script)
  }).catch((error: unknown) => {
    loading = null
    document.querySelector(`script[src="${SCRIPT_URL}"]`)?.remove()
    throw error
  })
  return loading
}
