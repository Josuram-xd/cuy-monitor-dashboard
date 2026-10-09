export interface UpdateProfileRequest {
  fullName: string
}

export interface ChangePasswordRequest {
  // missing only for an account without password (made with Google)
  currentPassword?: string
  newPassword: string
}

export interface DeactivateAccountRequest {
  currentPassword?: string
}
