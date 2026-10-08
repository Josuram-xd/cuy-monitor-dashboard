export interface RegisterRequest {
  username: string
  fullName: string
  email: string
  password: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface VerifyOtpRequest {
  challengeId: string
  code: string
}

// answer of register and login: a code was sent by email
export interface LoginChallenge {
  challengeId: string
  expiresAt: string
}

export interface AuthToken {
  accessToken: string
  tokenType: 'Bearer'
  expiresAt: string
}
