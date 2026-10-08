import type { ApiError } from './ApiError'

type Listener = (error: ApiError) => void

// Observer: HttpClient tells it a protected call got 401, AuthProvider listens and closes the session.
// Keeps the API layer free of React and the auth layer free of fetch.
export class UnauthorizedNotifier {
  private readonly listeners = new Set<Listener>()

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  notify(error: ApiError): void {
    for (const listener of [...this.listeners]) {
      listener(error)
    }
  }
}

export const unauthorizedNotifier = new UnauthorizedNotifier()
