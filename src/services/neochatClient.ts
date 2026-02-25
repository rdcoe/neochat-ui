import { appConfig } from '../config'
import type { AuthSession } from '../auth/types'

const requireSession = (session: AuthSession | null): AuthSession => {
  if (!session?.accessToken) {
    throw new Error('Missing access token. Please sign in first.')
  }

  return session
}

const buildHeaders = (session: AuthSession) => {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${session.accessToken}`,
    'Content-Type': 'application/json',
  }

  if (session.identityToken) {
    headers['X-Identity-Token'] = session.identityToken
  }

  return headers
}

export class NeochatClient {
  async listUsers(session: AuthSession | null) {
    const validatedSession = requireSession(session)
    const response = await fetch(`${appConfig.adminApiBaseUrl}/api/admin/users`, {
      method: 'GET',
      headers: buildHeaders(validatedSession),
    })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`Admin API error (${response.status}): ${body}`)
    }

    return response.json()
  }

  connectChat(
    conversationId: string,
    session: AuthSession,
    onMessage: (message: string) => void,
    onOpen: () => void,
    onClose: () => void,
    onError: (error: Event) => void,
  ): WebSocket {
    const wsUrl = `${appConfig.chatWsBaseUrl}/api/chat/${encodeURIComponent(conversationId)}?token=${encodeURIComponent(session.accessToken)}`
    const socket = new WebSocket(wsUrl)

    socket.onopen = onOpen
    socket.onclose = onClose
    socket.onerror = onError
    socket.onmessage = (event) => {
      onMessage(String(event.data))
    }

    return socket
  }
}
