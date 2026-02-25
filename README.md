# NeoChat UI

React + TypeScript frontend for the NeoChat backend.

This UI is intentionally Keycloak-first and aligned to the backend's current two-token contract:

- Access token (`Authorization: Bearer ...`) for JWT validation and scope authorization.
- Identity token (`X-Identity-Token` header for REST, `identity_token` in chat payload) for role-based authentication (`@RolesAllowed`) and RBAC checks.

## Quick start

1. Copy and adjust env values:

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
npm install
```

3. Run the app:

```bash
npm run dev
```

## Current auth provider support

- `keycloak` (implemented): browser OIDC redirect flow via `oidc-client-ts`.
- `entra-msal` (placeholder seam): selected by config but intentionally not implemented yet.

Set provider with:

```bash
VITE_AUTH_PROVIDER=keycloak
```

## Is MSAL flow premature?

Short answer: **yes, for now**.

Why:

1. Backend is currently configured for Keycloak OIDC issuer/client settings.
2. UI can already be made provider-agnostic through an auth adapter layer (implemented).
3. Implementing full MSAL before Entra tenant/app registration and backend issuer/audience validation updates would add churn with low immediate value.

Recommended path:

1. Ship and validate UI with Keycloak.
2. When moving to Azure, update backend OIDC/JWT validation for Entra issuer/audience.
3. Add concrete MSAL adapter in `src/auth/entraMsalAuthClient.ts` and switch `VITE_AUTH_PROVIDER=entra-msal`.
