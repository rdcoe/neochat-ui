export type AuthProviderType = 'keycloak' | 'entra-msal'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error'

export type AuthSession = {
  accessToken: string
  identityToken?: string
  subject?: string
  email?: string
  roles: string[]
}

export interface AuthClient {
  init(): Promise<AuthSession | null>
  signIn(): Promise<void>
  signOut(): Promise<void>
  handleCallbackIfPresent(): Promise<AuthSession | null>
  getSession(): AuthSession | null
}
