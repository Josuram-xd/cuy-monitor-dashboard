// The caps of docs/contracts/auth-api.md, the same ones the backend rejects with 400. They go on the
// inputs (maxLength) and in the validation of the form, so nothing endless is ever typed or sent.
export const USERNAME_MAX_LENGTH = 50
export const FULL_NAME_MAX_LENGTH = 150
export const EMAIL_MAX_LENGTH = 254
// Only for logging in: the password already exists, so the page is not the one to say how long it may
// be (the rule for a new one is PASSWORD_MAX_LENGTH of passwordRules.ts). This is the backend's cap.
export const LOGIN_PASSWORD_MAX_LENGTH = 200
