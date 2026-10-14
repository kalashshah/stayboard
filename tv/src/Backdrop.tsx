// Full-screen backdrop: color glow, photo, crossfading slideshow, or a muted looping video with a poster underneath.
import { Video } from '@amazon-devices/react-native-w3cmedia'
import React, { useEffect, useRef, useState } from 'react'
import { Animated, Image, StyleSheet, View } from 'react-native'
import { backdropFor, layoutFor, type PropertyConfig } from './types'
import type { Theme } from './ui'

const W = 960
const H = 540

export function Backdrop({ c, theme }: { c: PropertyConfig; theme: Theme }) {
  const b = backdropFor(c)
  const { overlay, blur, interval } = c.design.backdrop
  const scrim = layoutFor(c).scrim
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [b.kind === 'video' ? b.url : ''])
  const tint = theme.dark ? `rgba(0,0,0,${overlay / 100})` : `rgba(255,255,255,${overlay / 100})`
  const media = (() => {
    if (b.kind === 'video' && !failed) {
      return (
        <>
          {b.poster ? <Image source={{ uri: b.poster }} style={StyleSheet.absoluteFill} resizeMode="cover" blurRadius={blur} /> : null}
          <Video
            src={b.url} autoplay loop muted width={W} height={H} scalingmode="fill" style={StyleSheet.absoluteFill}
            onError={() => setFailed(true)}
          />
        </>
      )
    }
    const photo = b.kind === 'photo' ? b.url : b.kind === 'video' ? b.poster : ''
    if (b.kind === 'slideshow') return <Slideshow urls={b.urls} interval={interval} blur={blur} />
    if (photo) return <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="cover" blurRadius={blur} />
    return <View style={[styles.glow, { backgroundColor: theme.accent, opacity: theme.dark ? 0.32 : 0.18 }]} />
  })()
  const hasMedia = b.kind !== 'color' && !(b.kind === 'video' && failed && !b.poster)
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.bg }]} pointerEvents="none">
      {media}
      {hasMedia ? <View style={[StyleSheet.absoluteFill, { backgroundColor: tint }]} /> : null}
      {scrim ? (
        <>
          <View style={[styles.scrim, { height: H * 0.55, backgroundColor: theme.dark ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.3)' }]} />
          <View style={[styles.scrim, { height: H * 0.3, backgroundColor: theme.dark ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.4)' }]} />
        </>
      ) : null}
    </View>
  )
}

/** Two stacked images; the newer one fades in over 600 ms every `interval` seconds. */
function Slideshow({ urls, interval, blur }: { urls: string[]; interval: number; blur: number }) {
  const [i, setI] = useState(0)
  const fade = useRef(new Animated.Value(1)).current
  useEffect(() => {
    const id = setInterval(() => setI((x) => x + 1), interval * 1000)
    return () => clearInterval(id)
  }, [interval, urls.length])
  useEffect(() => {
    if (i === 0) return
    fade.setValue(0)
    Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true }).start()
  }, [i])
  const cur = urls[i % urls.length]
  const prev = urls[(i + urls.length - 1) % urls.length]
  return (
    <>
      <Image source={{ uri: prev }} style={StyleSheet.absoluteFill} resizeMode="cover" blurRadius={blur} />
      <Animated.Image source={{ uri: cur }} style={[StyleSheet.absoluteFill, { opacity: fade }]} resizeMode="cover" blurRadius={blur} />
    </>
  )
}

const styles = StyleSheet.create({
  glow: { position: 'absolute', right: -150, top: -210, width: 550, height: 550, borderRadius: 550 },
  scrim: { position: 'absolute', left: 0, right: 0, bottom: 0 },
})
