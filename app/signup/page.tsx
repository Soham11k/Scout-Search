'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AuthShell } from '@/components/auth-shell'
import {
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
  const { signUp, status } = useAuth()

  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [accept, setAccept] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

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

        <p className="text-center text-[11px] text-muted-foreground">
          Your account is stored in this browser only — perfect for trying
          Scout safely.
        </p>
      </form>
    </AuthShell>
  )
}
