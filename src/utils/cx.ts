type ClassValue = string | false | null | undefined

// joins CSS module classes and skips the falsy ones: cx(styles.a, active && styles.b)
export function cx(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(' ')
}
