export const config = {
  // empty = same origin (Caddy in prod, Vite proxy in dev)
  apiUrl: import.meta.env.VITE_API_URL ?? '',
  cageId: import.meta.env.VITE_CAGE_ID || 'cage-1',
  useMocks: import.meta.env.VITE_USE_MOCKS === 'true',
}
