// Full-screen backdrop: accent bloom on a flat colour, photo, crossfading slideshow, or a muted looping video with a poster underneath.
import { Video } from '@amazon-devices/react-native-w3cmedia'
import React, { useEffect, useRef, useState } from 'react'
import { Animated, Image, StyleSheet, View } from 'react-native'
import { backdropFor, layoutFor, type PropertyConfig } from './types'
import type { Theme } from './ui'

const W = 960
const H = 540
const glow = require('../assets/glow.png')
const shade = require('../assets/shade.png')

export function Backdrop({ c, theme }: { c: PropertyConfig | null; theme: Theme }) {
  const b = c ? backdropFor(c) : { kind: 'color' as const }
  const { overlay, blur, interval } = c?.design.backdrop ?? { overlay: 0, blur: 0, interval: 10 }
  const scrim = c ? layoutFor(c).scrim : false
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [b.kind === 'video' ? b.url : ''])
  const tintColor = theme.dark ? `rgba(0,0,0,${overlay / 100})` : `rgba(255,255,255,${overlay / 100})`
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
    return <Bloom theme={theme} />
  })()
  const hasMedia = b.kind !== 'color' && !(b.kind === 'video' && failed && !b.poster)
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.bg }]} pointerEvents="none">
      {media}
      {hasMedia ? <View style={[StyleSheet.absoluteFill, { backgroundColor: tintColor }]} /> : null}
      {hasMedia ? <Shade theme={theme} height={H * 0.55} opacity={0.45} /> : null}
      {scrim ? <Shade theme={theme} height={H * 0.7} opacity={0.75} /> : null}
    </View>
  )
}

/** Flat colour mode: two soft accent blooms (a tinted alpha texture) and a gentle darkening toward the bottom. */
function Bloom({ theme }: { theme: Theme }) {
  return (
    <>
      <Image source={glow} style={[styles.bloom, { right: -300, top: -340, width: 900, height: 900, tintColor: theme.accent, opacity: theme.dark ? 0.55 : 0.32 }]} />
      <Image source={glow} style={[styles.bloom, { left: -420, bottom: -460, width: 820, height: 820, tintColor: theme.accent, opacity: theme.dark ? 0.22 : 0.14 }]} />
      <Shade theme={theme} height={H * 0.7} opacity={0.5} />
    </>
  )
}

/** Smooth bottom-up darkening (white on light themes) from a 4×256 alpha ramp stretched over the bottom of the screen. */
function Shade({ theme, height, opacity }: { theme: Theme; height: number; opacity: number }) {
  return <Image source={shade} resizeMode="stretch" style={[styles.bottom, { height, opacity, tintColor: theme.dark ? '#000000' : '#ffffff' }]} />
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
  bloom: { position: 'absolute' },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0 },
})
