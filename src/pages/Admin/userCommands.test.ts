import { describe, expect, it, vi } from 'vitest'
import type { AdminUser } from '../../types/Admin'
import {
  demoteCommand,
  disableCommand,
  enableCommand,
  promoteCommand,
  type UserReceiver,
} from './userCommands'

const user = {
  id: 'u-7',
  fullName: 'Ana Quispe',
  email: 'ana@cuymonitor.local',
  role: 'BREEDER',
  status: 'ACTIVE',
} as AdminUser

function receiver() {
  return {
    changeRole: vi.fn(),
    setEnabled: vi.fn(),
  } satisfies UserReceiver
}

const callbacks = { onSuccess: () => {}, onError: () => {} }

describe('user commands', () => {
  it('promotes in two steps: the first one only opens the final confirmation', () => {
    const first = promoteCommand(user)
    expect(first.next).toBeDefined()
    expect(first.next?.next).toBeUndefined()
    expect(first.next?.explain).toContain(user.email)

    const r = receiver()
    first.next!.execute(r, callbacks)
    expect(r.changeRole).toHaveBeenCalledWith({ id: 'u-7', role: 'ADMIN' }, callbacks)
  })

  it('demotes to a breeder', () => {
    const r = receiver()
    demoteCommand({ ...user, role: 'ADMIN' }).execute(r, callbacks)
    expect(r.changeRole).toHaveBeenCalledWith({ id: 'u-7', role: 'BREEDER' }, callbacks)
  })

  it('enables without the danger style', () => {
    const command = enableCommand({ ...user, status: 'DISABLED' })
    expect(command.danger).toBe(false)
    const r = receiver()
    command.execute(r, callbacks)
    expect(r.setEnabled).toHaveBeenCalledWith({ id: 'u-7', enabled: true }, callbacks)
  })

  it('disables with the danger style', () => {
    const command = disableCommand(user)
    expect(command.danger).toBe(true)
    const r = receiver()
    command.execute(r, callbacks)
    expect(r.setEnabled).toHaveBeenCalledWith({ id: 'u-7', enabled: false }, callbacks)
  })
})
