// The admin's own actions (promote, demote, switch on or off), shown in "Registro de acciones".
// shortcut: kept in this browser only (localStorage), so another device or a cleared browser starts empty;
// a backend table of admin actions is the upgrade if the log has to be shared or audited.
const KEY = 'cuy-monitor.admin-actions'
const MAX_ACTIONS = 100

export interface AdminAction {
  at: string
  text: string
  ok: boolean
}

export function readActions(): AdminAction[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(stored) ? (stored as AdminAction[]) : []
  } catch {
    return []
  }
}

/** Adds one action at the top and returns the new list (also when the browser refuses to store it). */
export function recordAction(text: string, ok: boolean): AdminAction[] {
  const next = [{ at: new Date().toISOString(), text, ok }, ...readActions()].slice(0, MAX_ACTIONS)
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // private window or full storage: the list still shows for this visit
  }
  return next
}
