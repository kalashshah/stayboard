import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import type { PropertyConfig } from '../types'
import { Chrome, Eyebrow, Fade, PAD, Panel, type Theme } from '../ui'

export function Contacts({ c, theme, onBack }: { c: PropertyConfig; theme: Theme; onBack: () => void }) {
  return (
    <Fade style={styles.wrap}>
      <Chrome c={c} theme={theme} title="Contacts" sub="We're a message away" onBack={onBack} focusBack />
      <View style={styles.grid}>
        {c.contacts.map((k, i) => (
          <Panel key={i} theme={theme} style={styles.card}>
            <View style={[styles.glyphWrap, { backgroundColor: theme.chip }]}><Text style={[styles.glyph, { color: theme.ink }]}>✆</Text></View>
            <View style={{ flex: 1, gap: 2 }}>
              <Eyebrow theme={theme}>{k.label}</Eyebrow>
              <Text style={[styles.v, { color: theme.ink, fontFamily: theme.fontBold }]} numberOfLines={2}>{k.value}</Text>
            </View>
          </Panel>
        ))}
        {c.contacts.length === 0 && <Text style={{ color: theme.sub, fontSize: 14, fontFamily: theme.font }}>No contacts yet.</Text>}
      </View>
    </Fade>
  )
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: PAD, paddingVertical: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: 438, flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18 },
  glyphWrap: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  glyph: { fontSize: 22 },
  v: { fontSize: 22, letterSpacing: -0.5, lineHeight: 27 },
})
