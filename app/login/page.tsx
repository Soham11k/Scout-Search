'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { AuthShell } from '@/components/auth-shell'
import {
  Divider,
  Field,
  InlineAlert,
  PasswordInput,
  SubmitButton,
  TextInput,
} from '@/components/auth-form-fields'
import { useAuth } from '@/lib/auth'

function LoginInner() {
  const router = useRouter()
  const search = useSearchParams()
  const redirect = search.get('next') || '/app'
  const { signIn, status } = useAuth()

  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (status === 'authenticated') router.replace(redirect)
  }, [status, redirect, router])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn(email, password)
      toast.success('Welcome back')
      router.push(redirect)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title={
        <>
          Welcome back. <span className="font-serif italic">Sit down.</span>
        </>
      }
      subtitle="Sign in to your Scout account to open your bookmarks and recent searches."
      footer={
        <span>
          New here?{' '}
          <Link href="/signup" className="dotted-underline hover:text-foreground">
            Create an account
          </Link>
          .
        </span>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {error && <InlineAlert>{error}</InlineAlert>}
        <Field label="Email">
          <TextInput
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@somewhere.quiet"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </Field>
        <Field
          label="Password"
          hint={
            <Link
              href="#"
              className="hover:text-foreground dotted-underline"
              onClick={(e) => {
                e.preventDefault()
                toast.message(
                  'Password reset is a demo limitation — try signing up with a new email.',
                )
              }}
            >
              Forgot?
            </Link>
          }
        >
          <PasswordInput
            autoComplete="current-password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>

        <SubmitButton loading={loading}>Sign in</SubmitButton>

        <Divider label="or" />

        <button
          type="button"
          onClick={() =>
            toast.message('SSO is on the roadmap', {
              description: 'For now, create a local account — it takes 15 seconds.',
            })
          }
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
        >
          <GoogleMark />
          Continue with Google
        </button>
      </form>
    </AuthShell>
  )
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.4-5.8 7.5-10.8 7.5-6.4 0-11.5-5.1-11.5-11.5S18.1 12.5 24.5 12.5c2.9 0 5.6 1.1 7.7 2.9l5.7-5.7C34.7 6.3 30 4.5 24.5 4.5 13 4.5 3.5 14 3.5 25.5S13 46.5 24.5 46.5c11 0 19.8-8 19.8-20 0-1.3-.1-2.6-.3-3.9z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16.1 19 12.5 24.5 12.5c2.9 0 5.6 1.1 7.7 2.9l5.7-5.7C34.7 6.3 30 4.5 24.5 4.5 16.7 4.5 10 9.1 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24.5 46.5c5.4 0 10.3-1.7 14.1-4.7l-6.5-5.5c-2.1 1.4-4.7 2.2-7.6 2.2-5 0-9.2-3.1-10.8-7.4l-6.6 5.1C9.9 42 16.6 46.5 24.5 46.5z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.7 2-2 3.8-3.7 5l6.5 5.5c-.5.4 6.5-4.7 6.5-13 0-1.3-.1-2.6-.3-3.9z"
      />
    </svg>
  )
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={null}>
      <LoginInner />
    </React.Suspense>
  )
}
