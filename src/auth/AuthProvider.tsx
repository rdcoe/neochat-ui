import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { appConfig } from '../config'
import { entraMsalAuthClient } from './entraMsalAuthClient'
import { keycloakAuthClient } from './keycloakAuthClient'
import type { AuthClient, AuthProviderType, AuthSession, AuthStatus } from './types'

type AuthContextType = {
  authProvider: AuthProviderType
  status: AuthStatus
  session: AuthSession | null
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

const getAuthClient = (): AuthClient => {
  if (appConfig.authProvider === 'entra-msal') {
    return entraMsalAuthClient
  }

  return keycloakAuthClient
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [session, setSession] = useState<AuthSession | null>(null)

  const client = useMemo(() => getAuthClient(), [])

  useEffect(() => {
    let cancelled = false

    const initialize = async () => {
      try {
        const callbackSession = await client.handleCallbackIfPresent()
        const currentSession = callbackSession ?? (await client.init())

        if (cancelled) {
          return
        }

        setSession(currentSession)
        setStatus(currentSession ? 'authenticated' : 'unauthenticated')
      } catch {
        if (!cancelled) {
          setStatus('error')
        }
      }
    }

    void initialize()

    return () => {
      cancelled = true
    }
  }, [client])

  const value: AuthContextType = {
    authProvider: appConfig.authProvider,
    status,
    session,
    signIn: async () => {
      await client.signIn()
    },
    signOut: async () => {
      await client.signOut()
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
