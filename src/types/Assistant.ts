// POST /api/v1/assistant/messages (cuy-monitor-backend docs/contracts/rest-api.md, section 3.10)

export type AssistantRole = 'USER' | 'ASSISTANT'

export interface AssistantMessage {
  role: AssistantRole
  text: string
}

export interface AssistantRequest {
  language: 'es' | 'en'
  // oldest first, at most 12, the last one is the new question
  messages: AssistantMessage[]
}

export interface AssistantReply {
  reply: string
}

// limits of the contract
export const ASSISTANT_MAX_MESSAGES = 12
export const ASSISTANT_MAX_TEXT_LENGTH = 1000
