'use client'

import * as React from 'react'
import type { User as SupabaseAuthUser } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'

export type User = {
  id: string
  name: string
  email: string
  avatarHue: number
  createdAt: string
}

type AuthState = {
  user: User | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
  /** True when Supabase env is present — sessions are cookie-based and server-verified */
  mode: 'supabase' | 'local'
}

type AuthContextValue = AuthState & {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (input: {
    name: string
    email: string
    password: string
  }) => Promise<void>
  signInWithGoogle: (redirectTo?: string) => Promise<void>
  signOut: () => Promise<void>
}

const USERS_KEY = 'scout:users'
const SESSION_KEY = 'scout:session'
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30

const AuthContext = React.createContext<AuthContextValue | null>(null)

function useHasSupabase() {
  return (
    typeof process.env.NEXT_PUBLIC_SUPABASE_URL === 'string' &&
    process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
    typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'string' &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0
  )
}

async function sha256(text: string) {
  const buf = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest('SHA-256', buf)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

type StoredUser = User & { passwordHash: string }

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

function mapSupabaseUser(u: SupabaseAuthUser): User {
  const meta = u.user_metadata as Record<string, unknown> | undefined
  const name =
    (typeof meta?.full_name === 'string' && meta.full_name) ||
    (typeof meta?.name === 'string' && meta.name) ||
    u.email?.split('@')[0] ||
    'User'
  return {
    id: u.id,
    email: u.email || '',
    name,
    avatarHue: hueFromEmail(u.email || ''),
    createdAt: u.created_at || new Date().toISOString(),
  }
}

function stripPassword(u: StoredUser): User {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...rest } = u
  return rest
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const hasSupabase = useHasSupabase()
  const [state, setState] = React.useState<AuthState>({
    user: null,
    status: 'loading',
    mode: hasSupabase ? 'supabase' : 'local',
  })

  React.useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    if (hasSupabase && supabase) {
      void supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setState({
            user: mapSupabaseUser(session.user),
            status: 'authenticated',
            mode: 'supabase',
          })
        } else {
          setState({ user: null, status: 'unauthenticated', mode: 'supabase' })
        }
      })

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setState({
            user: mapSupabaseUser(session.user),
            status: 'authenticated',
            mode: 'supabase',
          })
        } else {
          setState({ user: null, status: 'unauthenticated', mode: 'supabase' })
        }
      })

      return () => subscription.unsubscribe()
    }

    const session = readSession()
    if (!session) {
      setState({ user: null, status: 'unauthenticated', mode: 'local' })
      return
    }
    const users = readUsers()
    const stored = Object.values(users).find((u) => u.id === session.userId)
    if (!stored) {
      localStorage.removeItem(SESSION_KEY)
      setState({ user: null, status: 'unauthenticated', mode: 'local' })
      return
    }
    setState({ user: stripPassword(stored), status: 'authenticated', mode: 'local' })
  }, [hasSupabase])

  const signIn = React.useCallback(
    async (email: string, password: string) => {
      const normalizedEmail = email.trim().toLowerCase()
      if (!normalizedEmail || !password) {
        throw new Error('Please enter your email and password.')
      }

      const supabase = getSupabaseBrowserClient()
      if (hasSupabase && supabase) {
        const { error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        })
        if (error) throw new Error(error.message)
        return
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
      setState({ user: stripPassword(stored), status: 'authenticated', mode: 'local' })
    },
    [hasSupabase],
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

      const supabase = getSupabaseBrowserClient()
      if (hasSupabase && supabase) {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: { full_name: normalizedName },
          },
        })
        if (error) throw new Error(error.message)
        if (data.user && !data.session) {
          throw new Error(
            'Account created — check your email to confirm, then sign in.',
          )
        }
        return
      }

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
      setState({ user: stripPassword(user), status: 'authenticated', mode: 'local' })
    },
    [hasSupabase],
  )

  const signOut = React.useCallback(async () => {
    const supabase = getSupabaseBrowserClient()
    if (hasSupabase && supabase) {
      await supabase.auth.signOut()
      setState({ user: null, status: 'unauthenticated', mode: 'supabase' })
      return
    }
    localStorage.removeItem(SESSION_KEY)
    setState({ user: null, status: 'unauthenticated', mode: 'local' })
  }, [hasSupabase])

  const signInWithGoogle = React.useCallback(
    async (redirectTo?: string) => {
      const supabase = getSupabaseBrowserClient()
      if (!hasSupabase || !supabase) {
        throw new Error(
          'Google sign-in requires Supabase. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then configure the Google provider in your Supabase dashboard.',
        )
      }
      const origin =
        typeof window !== 'undefined' ? window.location.origin : ''
      const callback = `${origin}/auth/callback${
        redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : ''
      }`
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: callback },
      })
      if (error) throw new Error(error.message)
    },
    [hasSupabase],
  )

  const value = React.useMemo<AuthContextValue>(
    () => ({ ...state, signIn, signUp, signInWithGoogle, signOut }),
    [state, signIn, signUp, signInWithGoogle, signOut],
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
