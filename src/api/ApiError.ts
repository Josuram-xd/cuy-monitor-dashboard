// Every failed call ends here, with the backend error code ("conflict", "not_found"...).
// network_error = never reached the server; unknown_error = the answer wasn't the API's JSON.
// The message is the backend's raw text: useful for logic, never shown to the farmer.
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  // failing fields of a validation error, e.g. { password: "size must be..." }
  readonly fields: Record<string, string>

  constructor(status: number, code: string, message?: string, fields: Record<string, string> = {}) {
    super(message ?? code)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fields = fields
  }

  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500
  }

  get isNetworkError(): boolean {
    return this.status === 0
  }

  get isUnauthorized(): boolean {
    return this.status === 401
  }
}
