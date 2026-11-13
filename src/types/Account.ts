export interface UpdateProfileRequest {
  fullName: string
  // null or blank clears it, and the screens fall back to the full name
  nickname?: string | null
}

export const NICKNAME_MAX_LENGTH = 30

export interface ProfilePhotoRequest {
  // base64 without the "data:" prefix, the same shape a cuy's photo is sent in
  photo: string
  photoContentType: string
}

export interface ChangePasswordRequest {
  // missing only for an account without password (made with Google)
  currentPassword?: string
  newPassword: string
}

export interface DeactivateAccountRequest {
  currentPassword?: string
}
