// Background music: one looping track at the host's volume, remounted when the URL changes. Failures are silent.
import { Audio } from '@amazon-devices/react-native-w3cmedia'
import React, { useEffect, useRef } from 'react'

export function Music({ enabled, url, volume }: { enabled: boolean; url: string; volume: number }) {
  const ref = useRef<Audio | null>(null)
  useEffect(() => {
    if (ref.current) ref.current.volume = volume / 100
  }, [volume])
  if (!enabled || !url) return null
  return <Audio key={url} ref={(r) => { ref.current = r }} src={url} autoplay loop volume={volume / 100} onError={() => {}} />
}
