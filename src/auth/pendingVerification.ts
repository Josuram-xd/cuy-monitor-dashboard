import type { LoginChallenge, LoginRequest } from '../types/Auth'

export interface PendingVerificationData {
  challenge: LoginChallenge
  // kept to resend the code (resend = log in again); never stored anywhere else
  credentials: LoginRequest
  // only known after registering; login does not return it
  email?: string
}

// Hands the code challenge from /login or /register to /verify, in memory only.
// Not router state: history.state survives reloads and could end up on disk.
export class PendingVerification {
  private data: PendingVerificationData | null = null

  start(data: PendingVerificationData): void {
    this.data = data
  }

  current(): PendingVerificationData | null {
    return this.data
  }

  replaceChallenge(challenge: LoginChallenge): void {
    if (this.data) {
      this.data = { ...this.data, challenge }
    }
  }

  clear(): void {
    this.data = null
  }
}

export const pendingVerification = new PendingVerification()
