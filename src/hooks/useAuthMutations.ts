import { useMutation } from '@tanstack/react-query'
import { getDashboardApi } from '../api/apiProvider'
import type { LoginRequest, RegisterRequest, VerifyOtpRequest } from '../types/Auth'

export function useLoginMutation() {
  return useMutation({
    mutationFn: async (body: LoginRequest) => (await getDashboardApi()).auth.login(body),
  })
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: async (body: RegisterRequest) => (await getDashboardApi()).auth.register(body),
  })
}

export function useVerifyOtpMutation() {
  return useMutation({
    mutationFn: async (body: VerifyOtpRequest) => (await getDashboardApi()).auth.verifyOtp(body),
  })
}
