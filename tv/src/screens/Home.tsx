import { TVFocusGuideView } from '@amazon-devices/react-native-kepler'
import React, { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { headlineFor, visibleTiles, type PropertyConfig, type TileKey } from '../types'
import { Focusable, PAD, type Theme } from '../ui'

const LABEL: Record<TileKey, string> = {
  wifi: 'Wi-Fi', checkout: 'Checkout', rules: 'House rules', guide: 'House guide', places: 'Local picks', contacts: 'Contacts', ask: 'Ask the house',
}
const SUB: Record<TileKey, (c: PropertyConfig) => string> = {
  wifi: (c) => c.wifi.ssid || 'Ask your host',
  checkout: (c) => c.stay.checkOut,
  rules: (c) => `${c.rules.length} to know`,
  guide: (c) => `${c.guide.length + c.faqs.length} topics`,
  places: (c) => `${c.places.length} nearby`,
  contacts: (c) => c.contacts[0]?.label ?? 'Reach us',
  ask: () => 'Any question',
}

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
  const tiles = visibleTiles(c)
  return (
    <View style={styles.wrap}>
      <View style={styles.top}>
        <Text style={[styles.name, { color: theme.ink }]}>{c.name}</Text>
        <Text style={[styles.time, { color: theme.sub }]}>{notice ? `${notice}  ·  ` : ''}{time}</Text>
      </View>
      <View style={styles.hero}>
        <Text style={[styles.h, { color: theme.ink }]}>{headlineFor(c)}</Text>
        <Text style={[styles.p, { color: theme.sub }]}>{c.welcome.message}</Text>
      </View>
      <TVFocusGuideView autoFocus style={styles.row}>
        {tiles.map((k, i) => (
          <Focusable
            key={k}
            testID={`tile-${k}`}
            hasTVPreferredFocus={i === 0}
            onPress={() => onOpen(k)}
            style={[styles.tile, { backgroundColor: k === 'ask' ? theme.accent : theme.tile, borderColor: 'transparent' }]}
            focusStyle={{ backgroundColor: theme.accent, transform: [{ scale: 1.06 }] }}>
            {(f) => (
              <>
                <Text style={[styles.tileT, { color: f || k === 'ask' ? '#fff' : theme.ink }]}>{LABEL[k]}</Text>
                <Text style={[styles.tileS, { color: f || k === 'ask' ? 'rgba(255,255,255,0.82)' : theme.sub }]} numberOfLines={1}>{SUB[k](c)}</Text>
              </>
            )}
          </Focusable>
        ))}
      </TVFocusGuideView>
      <Text style={[styles.foot, { color: theme.sub }]}>Hosted by {c.hostName}  ·  Check-in {c.stay.checkIn}  ·  Checkout {c.stay.checkOut}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: PAD, paddingVertical: 56, justifyContent: 'space-between' },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 30, fontWeight: '600', letterSpacing: -0.5 },
  time: { fontSize: 28 },
  hero: { gap: 14, maxWidth: 1400 },
  h: { fontSize: 92, fontWeight: '600', letterSpacing: -3, lineHeight: 100 },
  p: { fontSize: 32, lineHeight: 44, maxWidth: 1200 },
  row: { flexDirection: 'row', gap: 20 },
  tile: { flex: 1, minHeight: 210, borderRadius: 26, borderWidth: 4, padding: 26, justifyContent: 'flex-end', gap: 6 },
  tileT: { fontSize: 30, fontWeight: '600', letterSpacing: -0.5 },
  tileS: { fontSize: 22 },
  foot: { fontSize: 24 },
})
