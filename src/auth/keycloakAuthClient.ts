import { UserManager, WebStorageStateStore } from 'oidc-client-ts'
import { appConfig } from '../config'
import type { AuthClient, AuthSession } from './types'

const userManager = new UserManager({
  authority: appConfig.keycloak.authority,
  client_id: appConfig.keycloak.clientId,
  redirect_uri: appConfig.keycloak.redirectUri,
  post_logout_redirect_uri: appConfig.keycloak.postLogoutRedirectUri,
  response_type: 'code',
  scope: appConfig.keycloak.scope,
  userStore: new WebStorageStateStore({ store: window.sessionStorage }),
})

const normalizeRoles = (profile: Record<string, unknown> | undefined): string[] => {
  if (!profile) {
    return []
  }

  const groups = profile.groups
  if (Array.isArray(groups)) {
    return groups.filter((value): value is string => typeof value === 'string')
  }

  return []
}

const toSession = async (): Promise<AuthSession | null> => {
  const user = await userManager.getUser()
  if (!user || user.expired || !user.access_token) {
    return null
  }

  return {
    accessToken: user.access_token,
    identityToken: user.id_token,
    subject: user.profile.sub,
    email: typeof user.profile.email === 'string' ? user.profile.email : undefined,
    roles: normalizeRoles(user.profile as Record<string, unknown>),
  }
}

const handleCallbackIfPresent = async (): Promise<AuthSession | null> => {
  const hasOidcParams = window.location.search.includes('code=') || window.location.search.includes('state=')
  if (!hasOidcParams) {
    return toSession()
  }

  await userManager.signinRedirectCallback()
  window.history.replaceState({}, document.title, window.location.pathname)
  return toSession()
}

export const keycloakAuthClient: AuthClient = {
  init: toSession,
  signIn: () => userManager.signinRedirect(),
  signOut: () => userManager.signoutRedirect(),
  handleCallbackIfPresent,
  getSession: () => {
    return null
  },
}
