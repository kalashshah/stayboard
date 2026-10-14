import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import type { PropertyConfig } from '../types'
import { Chip, Chrome, Eyebrow, Fade, PAD, Panel, type Theme } from '../ui'

export function Places({ c, theme, onBack }: { c: PropertyConfig; theme: Theme; onBack: () => void }) {
  return (
    <Fade style={styles.wrap}>
      <Chrome c={c} theme={theme} title="Local picks" sub={`${c.hostName}'s favourites nearby`} onBack={onBack} focusBack />
      <ScrollView contentContainerStyle={styles.grid}>
        {c.places.map((p, i) => (
          <Panel key={i} theme={theme} style={styles.card}>
            <View style={styles.meta}>
              {p.category ? <Chip theme={theme}>{p.category}</Chip> : <View />}
              {p.distance ? <Eyebrow theme={theme}>{p.distance}</Eyebrow> : null}
            </View>
            <Text style={[styles.name, { color: theme.ink, fontFamily: theme.fontBold }]} numberOfLines={2}>{p.name}</Text>
            <Text style={[styles.note, { color: theme.sub, fontFamily: theme.font }]} numberOfLines={3}>{p.note}</Text>
          </Panel>
        ))}
        {c.places.length === 0 && <Text style={{ color: theme.sub, fontSize: 14, fontFamily: theme.font }}>No local picks yet.</Text>}
      </ScrollView>
    </Fade>
  )
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: PAD, paddingVertical: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 8 },
  card: { width: 288, gap: 6, padding: 18, minHeight: 128 },
  meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  name: { fontSize: 19, letterSpacing: -0.4, lineHeight: 23 },
  note: { fontSize: 13, lineHeight: 18 },
})
