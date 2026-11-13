import { useState } from 'react'
import { initials } from '../../utils/initials'
import type { User } from '../../types/User'

interface ProfilePhotoProps {
  user: User | undefined
  className?: string
}

// The breeder's own picture, with their initials as the fallback: an account without a photo, a photo
// that fails to load, and a profile that has not arrived yet all look the same deliberate circle.
export function ProfilePhoto({ user, className }: ProfilePhotoProps) {
  const src = user?.photoUrl ?? null
  // remembers which address failed, so a new picture is tried again
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  if (!src || src === failedSrc) {
    return <span aria-hidden="true">{initials(user?.displayName)}</span>
  }
  return (
    <img className={className} src={src} alt="" decoding="async" onError={() => setFailedSrc(src)} />
  )
}
