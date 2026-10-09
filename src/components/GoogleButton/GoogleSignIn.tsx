import { errorMessageKey } from '../../api/errorMessages'
import { useAuth } from '../../auth/useAuth'
import { useGoogleLoginMutation } from '../../hooks/useAuthMutations'
import { t } from '../../i18n'
import { FormError } from '../FormError/FormError'
import { GoogleButton } from './GoogleButton'

interface GoogleSignInProps {
  // "signin_with" on /login, "signup_with" on /register
  text: 'signin_with' | 'signup_with'
}

// "Continuar con Google" under the login and register forms. Google already proves the email, so
// there is no code step: the server sets the session cookies and PublicOnlyRoute sends the user in.
export function GoogleSignIn({ text }: GoogleSignInProps) {
  const { signIn } = useAuth()
  const google = useGoogleLoginMutation()

  return (
    <>
      <GoogleButton
        text={text}
        disabled={google.isPending}
        onCredential={(idToken) => google.mutate({ idToken }, { onSuccess: () => signIn() })}
      />
      {google.isError && <FormError message={t(errorMessageKey(google.error, 'google'))} />}
    </>
  )
}
