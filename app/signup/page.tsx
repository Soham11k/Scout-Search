'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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

function strengthOf(password: string) {
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  if (password.length >= 12) score++
  return Math.min(score, 4)
}

const STRENGTH_LABEL = ['', 'Weak', 'Okay', 'Strong', 'Excellent']
const STRENGTH_COLOR = [
  'bg-muted',
  'bg-destructive',
  'bg-[color:var(--accent-warm)]',
  'bg-[color:var(--accent-green)]',
  'bg-[color:var(--accent-green)]',
]

export default function SignupPage() {
  const router = useRouter()
  const { signUp, signInWithGoogle, status, mode } = useAuth()

  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [accept, setAccept] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [googleLoading, setGoogleLoading] = React.useState(false)

  React.useEffect(() => {
    if (status === 'authenticated') router.replace('/app')
  }, [status, router])

  const strength = strengthOf(password)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!accept) {
      setError('Please accept the terms to continue.')
      return
    }
    setLoading(true)
    try {
      await signUp({ name, email, password })
      toast.success('Account created', {
        description: 'Welcome to Scout. The kettle just boiled.',
      })
      router.push('/app')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      if (
        msg.toLowerCase().includes('check your email') ||
        msg.toLowerCase().includes('confirm')
      ) {
        toast.success('Confirm your email', { description: msg })
        router.push('/login')
        return
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title={
        <>
          Make yourself{' '}
          <span className="font-serif italic">at home.</span>
        </>
      }
      subtitle="Scout takes thirty seconds to set up. No credit card, no email verification."
      footer={
        <span>
          Already have an account?{' '}
          <Link href="/login" className="dotted-underline hover:text-foreground">
            Sign in
          </Link>
          .
        </span>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {error && <InlineAlert>{error}</InlineAlert>}
        <Field label="Your name">
          <TextInput
            autoComplete="name"
            placeholder="Amélie Laurent"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </Field>
        <Field label="Email">
          <TextInput
            type="email"
            autoComplete="email"
            placeholder="amelie@paperpixel.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
        <Field label="Password">
          <PasswordInput
            autoComplete="new-password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          {password.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex h-1 flex-1 gap-0.5 overflow-hidden rounded-full">
                {[1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className={`h-full flex-1 rounded-full transition-colors ${
                      i <= strength ? STRENGTH_COLOR[strength] : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
              <span className="w-16 text-right text-[11px] text-muted-foreground">
                {STRENGTH_LABEL[strength]}
              </span>
            </div>
          )}
        </Field>

        <label className="flex items-start gap-2 text-[13px] text-muted-foreground select-none">
          <input
            type="checkbox"
            checked={accept}
            onChange={(e) => setAccept(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border accent-[color:var(--primary)]"
          />
          <span>
            I agree to the{' '}
            <Link href="#" className="dotted-underline hover:text-foreground">
              Terms
            </Link>{' '}
            and{' '}
            <Link href="#" className="dotted-underline hover:text-foreground">
              Privacy notice
            </Link>
            .
          </span>
        </label>

        <SubmitButton loading={loading}>Create account</SubmitButton>

        <Divider label="or" />

        <button
          type="button"
          disabled={googleLoading}
          onClick={async () => {
            if (mode !== 'supabase') {
              toast.message('Google sign-up needs Supabase configured', {
                description:
                  'Set NEXT_PUBLIC_SUPABASE_URL and the anon key, then enable Google in your Supabase dashboard.',
              })
              return
            }
            setGoogleLoading(true)
            try {
              await signInWithGoogle('/app')
            } catch (err) {
              setGoogleLoading(false)
              setError(err instanceof Error ? err.message : 'Google sign-in failed')
            }
          }}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-60"
        >
          <GoogleMark />
          {googleLoading ? 'Redirecting to Google…' : 'Continue with Google'}
        </button>

        <p className="text-center text-[11px] text-muted-foreground">
          No card. No email verification if you sign up with Google.
        </p>
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
