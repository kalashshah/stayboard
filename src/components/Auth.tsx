'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { api, ApiError } from '@/api'
import { Alert } from '@/components/ui/alert'
import * as Btn from '@/components/ui/button'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import * as Modal from '@/components/ui/modal'
import { Field } from './Fields'

export type AuthMode = 'signup' | 'login'

/** Sign-in / sign-up dialog: email, then a six-digit code from the inbox. Signed in, it sends the host to `next`. */
export function Auth({ mode, onMode, onClose, next = '/app', initialError = '' }: { mode: AuthMode | null; onMode: (m: AuthMode) => void; onClose: () => void; next?: string; initialError?: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(initialError)
  const [busy, setBusy] = useState(false)
  const signup = mode === 'signup'
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true)
    setError('')
    try {
      await fn()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong')
    }
    setBusy(false)
  }
  const sendCode = () => run(async () => { await api.sendCode(email); setSent(true); setCode('') })
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!sent) return sendCode()
    return run(async () => {
      await api.verifyCode(email, code)
      router.push(next)
      router.refresh()
    })
  }
  return (
    <Modal.Root open={mode !== null} onOpenChange={(o) => { if (!o) { setSent(false); onClose() } }}>
      <Modal.Content className="max-w-[420px]">
        <Modal.Header>
          <div className="flex flex-1 flex-col gap-1">
            <Modal.Title>{sent ? 'Check your email' : signup ? 'Create your screen' : 'Welcome back'}</Modal.Title>
            <Modal.Description>{sent ? <>We sent a 6-digit code to <b className="font-medium text-text-strong-950">{email}</b>.</> : signup ? 'Your email is all it takes. No password.' : 'Sign in to edit your properties.'}</Modal.Description>
          </div>
        </Modal.Header>
        <form className="flex flex-col gap-4 px-5 pb-5" onSubmit={submit}>
          {sent ? (
            <>
              <Field label="Code">
                <Input inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="123456" value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} required autoFocus className="tracking-[0.3em]" />
              </Field>
              {error && <Alert>{error}</Alert>}
              <Button size="lg" className="w-full" loading={busy} disabled={code.length < 6}>Continue</Button>
              <div className="flex justify-between">
                <Btn.Root type="button" variant="neutral" mode="ghost" size="small" onClick={() => { setSent(false); setError('') }}>Use a different email</Btn.Root>
                <Btn.Root type="button" variant="neutral" mode="ghost" size="small" disabled={busy} onClick={sendCode}>Send a new code</Btn.Root>
              </div>
            </>
          ) : (
            <>
              <a href="/api/auth/google" className={buttonVariants({ variant: 'secondary', size: 'lg', className: 'w-full' })}>
                <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" className="relative z-10">
                  <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.9 6.1C12.4 13.7 17.7 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.7 6c4.5-4.2 6.9-10.3 6.9-17.7z" />
                  <path fill="#FBBC05" d="M10.5 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-7.9-6.1C.9 16.6 0 20.2 0 24s.9 7.4 2.6 10.7l7.9-6.1z" />
                  <path fill="#34A853" d="M24 48c6.3 0 11.7-2.1 15.6-5.8l-7.7-6c-2.1 1.4-4.8 2.3-7.9 2.3-6.3 0-11.6-4.2-13.5-9.9l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
                </svg>
                Continue with Google
              </a>
              <div className="flex items-center gap-3 text-paragraph-xs text-text-soft-400 before:flex-1 before:border-t before:border-stroke-soft-200 after:flex-1 after:border-t after:border-stroke-soft-200">or</div>
              <Field label="Email">
                <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
              </Field>
              {error && <Alert>{error}</Alert>}
              <Button size="lg" className="w-full" loading={busy}>Email me a code</Button>
              <Btn.Root type="button" variant="neutral" mode="ghost" size="small" onClick={() => { setError(''); onMode(signup ? 'login' : 'signup') }}>
                {signup ? 'Already have an account? Sign in' : 'New here? Create an account'}
              </Btn.Root>
            </>
          )}
        </form>
      </Modal.Content>
    </Modal.Root>
  )
}
