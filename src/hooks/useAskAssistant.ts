import { useMutation } from '@tanstack/react-query'
import { getDashboardApi } from '../api/apiProvider'
import type { AssistantReply, AssistantRequest } from '../types/Assistant'

// one question to Cuchi; nothing to cache or invalidate: the answer only lives in the chat
export function useAskAssistant() {
  return useMutation({
    mutationFn: async (body: AssistantRequest): Promise<AssistantReply> =>
      (await getDashboardApi()).assistant.ask(body),
  })
}
