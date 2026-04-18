'use client'

import * as React from 'react'

export type User = {
  id: string
  name: string
  email: string
  avatarHue: number
  createdAt: string
}

type StoredUser = User & { passwordHash: string }

type AuthState = {
  user: User | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
}

type AuthContextValue = AuthState & {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (input: { name: string; email: string; password: string }) => Promise<void>
  signOut: () => void
}

const USERS_KEY = 'scout:users'
const SESSION_KEY = 'scout:session'
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30 // 30 days

const AuthContext = React.createContext<AuthContextValue | null>(null)

async function sha256(text: string) {
  const buf = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest('SHA-256', buf)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function readUsers(): Record<string, StoredUser> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeUsers(users: Record<string, StoredUser>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function readSession(): { userId: string; expiresAt: number } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.userId || !parsed?.expiresAt) return null
    if (parsed.expiresAt < Date.now()) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function hueFromEmail(email: string) {
  let h = 0
  for (let i = 0; i < email.length; i++) h = (h * 31 + email.charCodeAt(i)) >>> 0
  return h % 360
}

function stripPassword(u: StoredUser): User {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...rest } = u
  return rest
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>({
    user: null,
    status: 'loading',
  })

  React.useEffect(() => {
    const session = readSession()
    if (!session) {
      setState({ user: null, status: 'unauthenticated' })
      return
    }
    const users = readUsers()
    const stored = Object.values(users).find((u) => u.id === session.userId)
    if (!stored) {
      localStorage.removeItem(SESSION_KEY)
      setState({ user: null, status: 'unauthenticated' })
      return
    }
    setState({ user: stripPassword(stored), status: 'authenticated' })
  }, [])

  const signIn = React.useCallback(
    async (email: string, password: string) => {
      const normalizedEmail = email.trim().toLowerCase()
      if (!normalizedEmail || !password) {
        throw new Error('Please enter your email and password.')
      }
      const users = readUsers()
      const stored = users[normalizedEmail]
      if (!stored) throw new Error('No account found for that email.')
      const hash = await sha256(password)
      if (hash !== stored.passwordHash) {
        throw new Error('That password doesn’t match. Try again.')
      }
      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          userId: stored.id,
          expiresAt: Date.now() + SESSION_TTL_MS,
        }),
      )
      setState({ user: stripPassword(stored), status: 'authenticated' })
    },
    [],
  )

  const signUp = React.useCallback(
    async ({
      name,
      email,
      password,
    }: {
      name: string
      email: string
      password: string
    }) => {
      const normalizedEmail = email.trim().toLowerCase()
      const normalizedName = name.trim()
      if (!normalizedName) throw new Error('Please enter your name.')
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail))
        throw new Error('Please enter a valid email.')
      if (password.length < 6)
        throw new Error('Password must be at least 6 characters.')

      const users = readUsers()
      if (users[normalizedEmail])
        throw new Error('An account with that email already exists.')

      const passwordHash = await sha256(password)
      const user: StoredUser = {
        id:
          typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `u_${Math.random().toString(36).slice(2)}`,
        name: normalizedName,
        email: normalizedEmail,
        avatarHue: hueFromEmail(normalizedEmail),
        createdAt: new Date().toISOString(),
        passwordHash,
      }
      users[normalizedEmail] = user
      writeUsers(users)
      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          userId: user.id,
          expiresAt: Date.now() + SESSION_TTL_MS,
        }),
      )
      setState({ user: stripPassword(user), status: 'authenticated' })
    },
    [],
  )

  const signOut = React.useCallback(() => {
    localStorage.removeItem(SESSION_KEY)
    setState({ user: null, status: 'unauthenticated' })
  }, [])

  const value = React.useMemo<AuthContextValue>(
    () => ({ ...state, signIn, signUp, signOut }),
    [state, signIn, signUp, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

export function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
