import {
  PublicClientApplication,
  type AccountInfo,
  type AuthenticationResult,
  type Configuration,
  type RedirectRequest,
  type SilentRequest,
} from '@azure/msal-browser'
import { appConfig } from '../config'
import type { AuthClient, AuthSession } from './types'

let cachedSession: AuthSession | null = null

const ensureConfigured = () => {
  if (!appConfig.entra.clientId) {
    throw new Error(
      'Missing VITE_ENTRA_CLIENT_ID. Configure Entra app registration values in .env before using VITE_AUTH_PROVIDER=entra-msal.',
    )
  }
}

const msalConfiguration: Configuration = {
  auth: {
    clientId: appConfig.entra.clientId,
    authority: appConfig.entra.authority,
    redirectUri: appConfig.entra.redirectUri,
    postLogoutRedirectUri: appConfig.entra.postLogoutRedirectUri,
  },
  cache: {
    cacheLocation: 'sessionStorage',
  },
}

const msal = new PublicClientApplication(msalConfiguration)

const getActiveAccount = (): AccountInfo | null => {
  const active = msal.getActiveAccount()
  if (active) {
    return active
  }

  const all = msal.getAllAccounts()
  if (all.length > 0) {
    msal.setActiveAccount(all[0])
    return all[0]
  }

  return null
}

const getResourceScopes = (): string[] => {
  if (appConfig.entra.apiScopes.length > 0) {
    return appConfig.entra.apiScopes
  }

  return appConfig.entra.loginScopes
}

const normalizeRoles = (claims: AuthenticationResult['idTokenClaims'] | undefined): string[] => {
  if (!claims) {
    return []
  }

  const typedClaims = claims as {
    roles?: unknown
    groups?: unknown
  }

  const fromRoles = typedClaims.roles
  if (Array.isArray(fromRoles)) {
    return fromRoles.filter((value): value is string => typeof value === 'string')
  }

  const fromGroups = typedClaims.groups
  if (Array.isArray(fromGroups)) {
    return fromGroups.filter((value): value is string => typeof value === 'string')
  }

  return []
}

const toSession = (result: AuthenticationResult): AuthSession => {
  const session: AuthSession = {
    accessToken: result.accessToken,
    identityToken: result.idToken,
    subject: result.account?.localAccountId,
    email: result.account?.username,
    roles: normalizeRoles(result.idTokenClaims),
  }

  cachedSession = session
  return session
}

const acquireSession = async (account: AccountInfo): Promise<AuthSession | null> => {
  const request: SilentRequest = {
    account,
    scopes: getResourceScopes(),
  }

  try {
    const response = await msal.acquireTokenSilent(request)
    return toSession(response)
  } catch {
    return null
  }
}

const handleCallbackIfPresent = async (): Promise<AuthSession | null> => {
  ensureConfigured()
  await msal.initialize()

  const response = await msal.handleRedirectPromise()
  if (!response) {
    return null
  }

  if (response.account) {
    msal.setActiveAccount(response.account)
  }

  const session = toSession(response)
  window.history.replaceState({}, document.title, window.location.pathname)
  return session
}

const init = async (): Promise<AuthSession | null> => {
  ensureConfigured()
  await msal.initialize()

  const account = getActiveAccount()
  if (!account) {
    cachedSession = null
    return null
  }

  const session = await acquireSession(account)
  cachedSession = session
  return session
}

const signIn = async (): Promise<void> => {
  ensureConfigured()
  await msal.initialize()

  const request: RedirectRequest = {
    scopes: [...new Set([...appConfig.entra.loginScopes, ...getResourceScopes()])],
  }

  await msal.loginRedirect(request)
}

const signOut = async (): Promise<void> => {
  await msal.initialize()
  await msal.logoutRedirect()
}

export const entraMsalAuthClient: AuthClient = {
  init,
  signIn,
  signOut,
  handleCallbackIfPresent,
  getSession: (): AuthSession | null => cachedSession,
}
