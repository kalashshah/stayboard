'use client'

import { RiAddLine, RiArrowRightSLine, RiHome4Line } from '@remixicon/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ago, api, ApiError, type PropertySummary } from '@/api'
import { TvPreview } from '@/components/Preview'
import { PageHead } from '@/components/Shell'
import { Alert } from '@/components/ui/alert'
import * as Badge from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export function Properties({ list }: { list: PropertySummary[] }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    setError('')
    try {
      const r = await api.createProperty(name.trim())
      router.push(`/app/p/${r.property.id}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create the property')
      setBusy(false)
    }
  }

  return (
    <main>
      <PageHead title="Your properties" lede="Each property has its own screen, guest page and inbox." />
      <Card className="flex flex-col gap-3 p-4">
        <form className="flex flex-wrap gap-2" onSubmit={create}>
          <Input className="min-w-[200px] flex-1" placeholder="New property name, e.g. Ocean View Loft" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
          <Button size="lg" loading={busy} disabled={!name.trim()}><RiAddLine className="relative z-10 -ml-1 size-4" />Create</Button>
        </form>
        {error && <Alert>{error}</Alert>}
      </Card>
      <div className="mt-5 flex flex-col gap-3">
        {list.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-20 border border-dashed border-stroke-sub-300 px-6 py-14 text-center">
            <span className="fancy fancy-orange mb-2 grid size-10 place-items-center rounded-10"><RiHome4Line className="size-5" /></span>
            <p className="text-label-md text-text-strong-950">No properties yet</p>
            <p className="text-paragraph-sm text-text-sub-600">Create one above and you’ll be editing in a second.</p>
          </div>
        )}
        {list.map((p) => (
          <Link key={p.id} href={`/app/p/${p.id}`} className="group">
            <Card className="flex flex-wrap items-center gap-4 p-3 transition duration-200 ease-out group-hover:-translate-y-0.5 group-hover:shadow-card">
              <div className="tv-thumb w-full shrink-0 sm:w-[200px]"><TvPreview config={p.config} still /></div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <h3 className="truncate text-label-lg text-text-strong-950">{p.name}</h3>
                <span className="text-paragraph-sm text-text-sub-600">Edited {ago(p.updated_at)} · {p.devices} TV{p.devices === 1 ? '' : 's'} paired</span>
              </div>
              <div className="flex items-center gap-2">
                {p.unanswered > 0 && <Badge.Root variant="lighter" color="red" size="medium">{p.unanswered} to answer</Badge.Root>}
                {p.devices === 0 && <Badge.Root variant="lighter" color="gray" size="medium">Not paired yet</Badge.Root>}
                <RiArrowRightSLine className="size-5 text-text-soft-400 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  )
}
