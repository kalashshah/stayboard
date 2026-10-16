'use client'

import { RiTvLine } from '@remixicon/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { api, ApiError, type PropertySummary } from '@/api'
import { Field } from '@/components/Fields'
import { PageHead } from '@/components/Shell'
import { Alert } from '@/components/ui/alert'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

export function Pair({ code: initial, list }: { code: string; list: PropertySummary[] }) {
  const router = useRouter()
  const [pid, setPid] = useState(list[0]?.id ?? '')
  const [code, setCode] = useState(initial)
  const [label, setLabel] = useState('Living room TV')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api.pair(pid, code, label)
      router.push(`/app/p/${pid}?tab=devices`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong')
      setBusy(false)
    }
  }

  return (
    <main>
      <PageHead title="Pair a TV" lede="Open Stayboard on the Fire TV. It shows a six-letter code. Type it here." />
      {list.length === 0 ? (
        <Card className="flex max-w-[480px] flex-col items-start gap-3">
          <RiTvLine className="size-6 text-text-soft-400" />
          <p className="text-paragraph-sm text-text-sub-600">Create a property first, then come back here.</p>
          <Link href="/app" className={buttonVariants({ variant: 'secondary' })}>Go to properties</Link>
        </Card>
      ) : (
        <Card className="max-w-[480px]">
          <form className="flex flex-col gap-4" onSubmit={submit}>
            <Field label="Code on the TV">
              <Input className="h-12 font-mono text-[18px] tracking-[0.3em] uppercase" value={code} maxLength={6} placeholder="ABC123" autoFocus
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} />
            </Field>
            <Field label="Property">
              <Select value={pid} onChange={(e) => setPid(e.target.value)}>
                {list.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </Field>
            <Field label="Which TV">
              <Input value={label} maxLength={60} onChange={(e) => setLabel(e.target.value)} />
            </Field>
            {error && <Alert>{error}</Alert>}
            <Button size="lg" loading={busy} disabled={code.length !== 6}>Pair</Button>
          </form>
        </Card>
      )}
    </main>
  )
}
