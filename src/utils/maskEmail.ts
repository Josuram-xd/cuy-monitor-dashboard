// "juan@gmail.com" -> "j•••@gmail.com": enough to recognise it, not to read it over a shoulder
export function maskEmail(email: string): string {
  const at = email.indexOf('@')
  if (at < 1) {
    return email
  }
  return `${email[0]}•••${email.slice(at)}`
}
