export const appConfig = {
  authProvider: (import.meta.env.VITE_AUTH_PROVIDER ?? 'keycloak') as 'keycloak' | 'entra-msal',
  keycloak: {
    authority: import.meta.env.VITE_OIDC_AUTHORITY ?? 'http://localhost:8180/realms/neochat',
    clientId: import.meta.env.VITE_OIDC_CLIENT_ID ?? 'chat-ui',
    redirectUri: import.meta.env.VITE_OIDC_REDIRECT_URI ?? window.location.origin,
    postLogoutRedirectUri:
      import.meta.env.VITE_OIDC_POST_LOGOUT_REDIRECT_URI ?? window.location.origin,
    scope: import.meta.env.VITE_OIDC_SCOPE ?? 'openid profile email',
  },
  adminApiBaseUrl: import.meta.env.VITE_ADMIN_API_BASE_URL ?? 'http://localhost:8081',
  chatWsBaseUrl: import.meta.env.VITE_CHAT_WS_BASE_URL ?? 'ws://localhost:8080',
}
