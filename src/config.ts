export const config = {
  // empty = same origin (Caddy in prod, Vite proxy in dev)
  apiUrl: import.meta.env.VITE_API_URL ?? '',
  // empty = ws(s)://<current host>/ws
  wsUrl: import.meta.env.VITE_WS_URL ?? '',
  cageId: import.meta.env.VITE_CAGE_ID || 'cage-1',
  useMocks: import.meta.env.VITE_USE_MOCKS === 'true',
  // public OAuth client id for "Continuar con Google"; empty hides the button (it is not a secret)
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '',
}
