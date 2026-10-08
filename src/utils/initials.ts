// "Juan Carlos Perez" -> "JC"; "?" while the name is not loaded
export function initials(fullName: string | undefined): string {
  const letters = (fullName ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')
  return letters || '?'
}
