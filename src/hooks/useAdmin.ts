import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getDashboardApi } from '../api/apiProvider'
import type { AdminCatalogKind, AdminCatalogOptionInput, UserRole } from '../types/Admin'
import { queryKeys } from './queryKeys'

export function useAdminCatalog(enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminCatalog,
    queryFn: async ({ signal }) => (await getDashboardApi()).admin.listCatalog(signal),
    enabled,
  })
}

export function useAdminUsers(enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminUsers,
    queryFn: async ({ signal }) => (await getDashboardApi()).admin.listUsers(signal),
    enabled,
  })
}

export function useSaveCatalogOptionMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: AdminCatalogOptionInput) =>
      (await getDashboardApi()).admin.saveCatalogOption(body),
    onSuccess: () => invalidateCatalog(queryClient),
  })
}

export function useDeactivateCatalogOptionMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ kind, code }: { kind: AdminCatalogKind; code: string }) =>
      (await getDashboardApi()).admin.deactivateCatalogOption(kind, code),
    onSuccess: () => invalidateCatalog(queryClient),
  })
}

export function useChangeUserRoleMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: UserRole }) =>
      (await getDashboardApi()).admin.changeUserRole(id, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers }),
  })
}

export function useSetUserEnabledMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) =>
      (await getDashboardApi()).admin.setUserEnabled(id, enabled),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers }),
  })
}

// the pickers of the whole app read ['catalog'], so a new breed shows up there without a reload
function invalidateCatalog(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.adminCatalog })
  void queryClient.invalidateQueries({ queryKey: queryKeys.catalog })
}
