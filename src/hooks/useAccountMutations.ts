import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getDashboardApi } from '../api/apiProvider'
import type {
  ChangePasswordRequest,
  DeactivateAccountRequest,
  ProfilePhotoRequest,
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

export function useProfilePhotoMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    // null removes it: the two go through one mutation because one button swaps between them
    mutationFn: async (body: ProfilePhotoRequest | null) => {
      const api = (await getDashboardApi()).account
      return body ? api.setPhoto(body) : api.removePhoto()
    },
    // the answer is empty, so the profile is read again: that is where the new address comes from
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.profile }),
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
