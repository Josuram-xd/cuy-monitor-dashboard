export interface UpdateProfileRequest {
  fullName: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface DeactivateAccountRequest {
  currentPassword: string
}
