import type { AuthClient, AuthSession } from './types'

const msalNotConfigured = async (): Promise<never> => {
  throw new Error(
    'MSAL provider is not configured yet. Start with Keycloak (VITE_AUTH_PROVIDER=keycloak). Add MSAL when Entra ID tenant/app registration is ready.',
  )
}

export const entraMsalAuthClient: AuthClient = {
  init: async () => null,
  signIn: msalNotConfigured,
  signOut: msalNotConfigured,
  handleCallbackIfPresent: async () => null,
  getSession: (): AuthSession | null => null,
}
