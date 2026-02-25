import { useMemo, useRef, useState } from 'react'
import { useAuth } from './auth/AuthProvider'
import { NeochatClient } from './services/neochatClient'
import './App.css'

function App() {
  const { authProvider, status, session, signIn, signOut } = useAuth()
  const [usersResponse, setUsersResponse] = useState<string>('')
  const [conversationId, setConversationId] = useState('demo-conversation')
  const [chatMessage, setChatMessage] = useState('Hello from NeoChat UI')
  const [chatLog, setChatLog] = useState<string[]>([])
  const socketRef = useRef<WebSocket | null>(null)

  const client = useMemo(() => new NeochatClient(), [])

  const pushLog = (entry: string) => {
    setChatLog((current) => [`${new Date().toISOString()}  ${entry}`, ...current].slice(0, 25))
  }

  const loadUsers = async () => {
    try {
      const users = await client.listUsers(session)
      setUsersResponse(JSON.stringify(users, null, 2))
    } catch (error) {
      setUsersResponse(String(error))
    }
  }

  const connect = () => {
    if (!session?.accessToken) {
      pushLog('Cannot connect: sign in first')
      return
    }

    socketRef.current?.close()
    socketRef.current = client.connectChat(
      conversationId,
      session,
      (message) => pushLog(`⬅ ${message}`),
      () => pushLog('WebSocket opened'),
      () => pushLog('WebSocket closed'),
      (error) => pushLog(`WebSocket error: ${String(error)}`),
    )
  }

  const disconnect = () => {
    socketRef.current?.close()
    socketRef.current = null
  }

  const sendMessage = () => {
    if (!socketRef.current) {
      pushLog('Socket not connected')
      return
    }

    if (!session?.identityToken) {
      pushLog('Missing identity token (required by chat service payload)')
      return
    }

    const payload = {
      conversation_id: conversationId,
      identity_token: session.identityToken,
      content: chatMessage,
      message_type: 'text',
    }

    socketRef.current.send(JSON.stringify(payload))
    pushLog(`➡ ${JSON.stringify(payload)}`)
  }

  return (
    <main className="container">
      <h1>NeoChat UI</h1>

      <section className="panel">
        <h2>Authentication</h2>
        <p>
          Provider: <strong>{authProvider}</strong>
        </p>
        <p>
          Status: <strong>{status}</strong>
        </p>
        <div className="row">
          <button onClick={signIn} disabled={status === 'loading' || status === 'authenticated'}>
            Sign in
          </button>
          <button onClick={signOut} disabled={status !== 'authenticated'}>
            Sign out
          </button>
        </div>
        <pre className="output">
          {JSON.stringify(
            {
              subject: session?.subject,
              roles: session?.roles,
              hasAccessToken: Boolean(session?.accessToken),
              hasIdentityToken: Boolean(session?.identityToken),
            },
            null,
            2,
          )}
        </pre>
      </section>

      <section className="panel">
        <h2>Admin API probe</h2>
        <p>Calls <code>/api/admin/users</code> with Bearer access token + <code>X-Identity-Token</code>.</p>
        <button onClick={loadUsers} disabled={status !== 'authenticated'}>
          Load users
        </button>
        <pre className="output">{usersResponse || 'No response yet'}</pre>
      </section>

      <section className="panel">
        <h2>Chat WebSocket probe</h2>
        <div className="row">
          <input
            value={conversationId}
            onChange={(event) => setConversationId(event.target.value)}
            placeholder="conversation id"
          />
          <button onClick={connect} disabled={status !== 'authenticated'}>
            Connect
          </button>
          <button onClick={disconnect}>Disconnect</button>
        </div>
        <div className="row">
          <input
            value={chatMessage}
            onChange={(event) => setChatMessage(event.target.value)}
            placeholder="message"
          />
          <button onClick={sendMessage}>Send</button>
        </div>
        <pre className="output">{chatLog.join('\n') || 'No events yet'}</pre>
      </section>
    </main>
  )
}

export default App
