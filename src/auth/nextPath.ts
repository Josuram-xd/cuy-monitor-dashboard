// Where to go after logging in. Only paths of this app: "/alerts" yes,
// "//evil.com" or "https://evil.com" no (open redirect).
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return '/'
  }
  return next
}

export function loginPathFor(currentPath: string): string {
  return currentPath === '/' ? '/login' : `/login?next=${encodeURIComponent(currentPath)}`
}
