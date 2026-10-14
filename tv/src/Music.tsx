// Background music: one looping track at the host's volume, remounted when the URL changes. Failures are silent.
import { Audio, AudioContentType, AudioUsageType } from '@amazon-devices/react-native-w3cmedia'
import React, { useEffect, useRef } from 'react'

export function Music({ enabled, url, volume }: { enabled: boolean; url: string; volume: number }) {
  const ref = useRef<Audio | null>(null)
  useEffect(() => {
    if (ref.current) ref.current.volume = volume / 100
  }, [volume])
  if (!enabled || !url) return null
  // USAGE_GAME: background ambience, not a media session. With the default (media) usage the system treats Back as "stop playback"
  // and leaves the app instead of letting BackHandler pop our screen stack.
  return (
    <Audio
      key={url} ref={(r) => { ref.current = r }} src={url} autoplay loop volume={volume / 100} onError={() => {}}
      audioType={AudioContentType.CONTENT_TYPE_MUSIC} audioUsage={AudioUsageType.USAGE_GAME} showCaptions={false}
    />
  )
}
