import type { AssistantReply, AssistantRequest } from '../../types/Assistant'
import type { AssistantApi } from '../DashboardApi'
import type { HttpClient } from '../HttpClient'

export class HttpAssistantApi implements AssistantApi {
  private readonly http: HttpClient

  constructor(http: HttpClient) {
    this.http = http
  }

  ask(body: AssistantRequest): Promise<AssistantReply> {
    return this.http.post<AssistantReply>('/api/v1/assistant/messages', body)
  }
}
