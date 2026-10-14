import { TVFocusGuideView } from '@amazon-devices/react-native-kepler'
import React, { useEffect, useState } from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { backdropFor, headlineFor, ICONS, layoutFor, tileLabel, tileSub, visibleTiles, type PropertyConfig, type TileKey } from '../types'
import { Focusable, PAD, type Theme } from '../ui'

function clock() {
  const d = new Date()
  const h = d.getHours()
  const m = d.getMinutes().toString().padStart(2, '0')
  return `${h % 12 || 12}:${m} ${h < 12 ? 'AM' : 'PM'}`
}

export function Home({ c, theme, onOpen, notice }: { c: PropertyConfig; theme: Theme; onOpen: (k: TileKey) => void; notice: string }) {
  const [time, setTime] = useState(clock())
  useEffect(() => {
    const id = setInterval(() => setTime(clock()), 15_000)
    return () => clearInterval(id)
  }, [])
  const d = c.design
  const L = layoutFor(c)
  const tiles = visibleTiles(c)
  const center = L.align === 'center'
  const compact = L.tiles === 'compact'
  const brand = d.logo
    ? <Image source={{ uri: d.logo }} style={styles.logo} resizeMode="contain" />
    : <Text style={[styles.name, { color: theme.ink, fontFamily: theme.fontBold }]}>{c.name}</Text>
  const clockText = <Text style={[styles.time, { color: theme.sub, fontFamily: theme.font }]}>{notice ? `${notice}  ·  ` : ''}{d.showClock ? time : ''}</Text>

  return (
    <View style={[styles.wrap, L.tiles === 'middle' && { justifyContent: 'flex-start' }]}>
      {L.topBar !== 'none' && (
        <View style={[styles.top, L.topBar === 'centered' && { justifyContent: 'center' }]}>
          {L.topBar === 'logo' && !d.logo ? <View /> : brand}
          {L.topBar === 'centered' ? <View style={styles.clockRight}>{clockText}</View> : clockText}
        </View>
      )}

      <View style={[styles.body, L.hero === 'middle' && { justifyContent: 'center' }, L.hero === 'top' && { justifyContent: 'flex-start' }, L.mediaCard && styles.split]}>
        <View style={[styles.hero, center && { alignItems: 'center', alignSelf: 'center' }, L.mediaCard && { flex: 1 }]}>
          <Text style={[styles.h, { color: theme.ink, fontFamily: theme.fontBold, fontSize: L.headline, lineHeight: L.headline * 1.08, textAlign: center ? 'center' : 'left' }]}>{headlineFor(c)}</Text>
          {L.hero !== 'top' && !!c.welcome.message && (
            <Text style={[styles.p, { color: theme.sub, fontFamily: theme.font, textAlign: center ? 'center' : 'left' }]}>{c.welcome.message}</Text>
          )}
        </View>
        {L.mediaCard && <MediaCard c={c} theme={theme} />}
      </View>

      <TVFocusGuideView autoFocus style={[styles.row, L.tiles === 'middle' && { flex: 1, alignItems: 'center' }, center && { justifyContent: 'center' }]}>
        {tiles.map((t, i) => (
          <Focusable
            key={t.key}
            testID={`tile-${t.key}`}
            hasTVPreferredFocus={i === 0}
            onPress={() => onOpen(t.key)}
            style={[
              styles.tile, compact ? styles.tileCompact : null,
              { backgroundColor: t.key === 'ask' ? theme.accent : theme.tile, borderColor: t.key === 'ask' ? 'transparent' : theme.tileBorder, borderWidth: theme.tileBorderWidth, borderRadius: theme.radius },
              L.tiles === 'middle' && { flex: 0, width: 118, height: 105 },
            ]}
            focusStyle={{ backgroundColor: theme.accent, borderColor: '#fff', transform: [{ scale: 1.06 }] }}>
            {(f) => {
              const on = f || t.key === 'ask'
              return (
                <>
                  {!compact && <Text style={[styles.glyph, { color: on ? '#fff' : theme.ink }]}>{ICONS[t.icon]}</Text>}
                  <View style={{ flexShrink: 1 }}>
                    <Text style={[styles.tileT, compact && { fontSize: 13 }, { color: on ? '#fff' : theme.ink, fontFamily: theme.fontBold }]} numberOfLines={1}>{tileLabel(t)}</Text>
                    <Text style={[styles.tileS, { color: on ? 'rgba(255,255,255,0.82)' : theme.sub, fontFamily: theme.font }]} numberOfLines={1}>{tileSub(c, t.key)}</Text>
                  </View>
                </>
              )
            }}
          </Focusable>
        ))}
      </TVFocusGuideView>

      {L.footer && (
        <Text style={[styles.foot, { color: theme.sub, fontFamily: theme.font, textAlign: center ? 'center' : 'left' }]}>Hosted by {c.hostName}  ·  Check-in {c.stay.checkIn}  ·  Checkout {c.stay.checkOut}</Text>
      )}
    </View>
  )
}

/** Split layout: the photo or video poster in a rounded card (one video decoder on screen, so the card never plays a second copy). */
function MediaCard({ c, theme }: { c: PropertyConfig; theme: Theme }) {
  const b = backdropFor(c)
  const d = c.design.backdrop
  const photo = b.kind === 'photo' ? b.url : b.kind === 'slideshow' ? b.urls[0] : b.kind === 'video' ? b.poster : d.photos[0] || d.poster
  return (
    <View style={[styles.media, { borderRadius: theme.radius, backgroundColor: photo ? 'rgba(0,0,0,0.25)' : theme.accent }]}>
      {photo ? <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: PAD, paddingVertical: 28, justifyContent: 'space-between', gap: 14 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 28 },
  clockRight: { position: 'absolute', right: 0 },
  name: { fontSize: 15, letterSpacing: -0.25 },
  logo: { height: 28, width: 220 },
  time: { fontSize: 14 },
  body: { flex: 1, justifyContent: 'flex-end' },
  split: { flexDirection: 'row', alignItems: 'center', gap: 28 },
  hero: { gap: 7, maxWidth: 700 },
  h: { letterSpacing: -1.5 },
  p: { fontSize: 16, lineHeight: 22, maxWidth: 600 },
  media: { width: '44%', aspectRatio: 16 / 10, overflow: 'hidden' },
  row: { flexDirection: 'row', gap: 10 },
  tile: { flex: 1, minHeight: 105, padding: 12, justifyContent: 'flex-end', gap: 3 },
  tileCompact: { minHeight: 70, paddingVertical: 10 }, // ponytail: compact rows drop the glyph so seven labels fit at 960 px
  glyph: { fontSize: 22, lineHeight: 26, marginBottom: 4 },
  tileT: { fontSize: 14, letterSpacing: -0.3 },
  tileS: { fontSize: 11 },
  foot: { fontSize: 12 },
})
