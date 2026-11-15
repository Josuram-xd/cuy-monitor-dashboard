import { readFileSync } from 'node:fs'

const caddyfile = readFileSync('Caddyfile', 'utf8')
const csp = /Content-Security-Policy "([^"]+)"/.exec(caddyfile)?.[1] ?? ''
const directive = (name: string) =>
  csp
    .split(';')
    .map((d) => d.trim())
    .find((d) => d.startsWith(`${name} `)) ?? ''

describe('Caddyfile security headers', () => {
  it('never allows inline or eval scripts', () => {
    expect(directive('script-src')).not.toMatch(/unsafe-/)
    expect(csp).not.toContain("'unsafe-eval'")
  })

  it('locks framing, base uri, forms and plugins', () => {
    for (const d of [
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ]) {
      expect(csp).toContain(d)
    }
    expect(caddyfile).toContain('X-Frame-Options DENY')
  })
})
