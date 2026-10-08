import { config } from '../config'

// same origin by default: wss:// behind Caddy, ws:// with the Vite dev proxy
export function wsUrl(
  configured: string = config.wsUrl,
  location: Location = window.location,
): string {
  if (configured) {
    return configured
  }
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${location.host}/ws`
}
