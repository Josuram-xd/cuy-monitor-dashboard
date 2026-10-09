import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getDashboardApi } from '../api/apiProvider'
import type {
  ChangePasswordRequest,
  DeactivateAccountRequest,
  UpdateProfileRequest,
} from '../types/Account'
import { queryKeys } from './queryKeys'

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: UpdateProfileRequest) =>
      (await getDashboardApi()).account.updateProfile(body),
    // the header menu and the greeting read the same cached profile
    onSuccess: (profile) => queryClient.setQueryData(queryKeys.profile, profile),
  })
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: async (body: ChangePasswordRequest) =>
      (await getDashboardApi()).account.changePassword(body),
  })
}

export function useDeactivateAccountMutation() {
  return useMutation({
    mutationFn: async (body: DeactivateAccountRequest) =>
      (await getDashboardApi()).account.deactivate(body),
  })
}
