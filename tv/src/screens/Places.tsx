import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import type { PropertyConfig } from '../types'
import { Card, Header, Mono, PAD, type Theme } from '../ui'

export function Places({ c, theme, onBack }: { c: PropertyConfig; theme: Theme; onBack: () => void }) {
  return (
    <View style={styles.wrap}>
      <Header theme={theme} title="Local picks" sub={`${c.hostName}'s favorites nearby`} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.grid}>
        {c.places.map((p, i) => (
          <Card key={i} theme={theme} style={styles.card}>
            <Mono theme={theme}>{[p.category, p.distance].filter(Boolean).join('  ·  ')}</Mono>
            <Text style={[styles.name, { color: theme.ink }]}>{p.name}</Text>
            <Text style={[styles.note, { color: theme.sub }]}>{p.note}</Text>
          </Card>
        ))}
        {c.places.length === 0 && <Text style={{ color: theme.sub, fontSize: 28 }}>No local picks yet.</Text>}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: PAD, paddingVertical: 56 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 24 },
  card: { width: 570, gap: 8, minHeight: 230 },
  name: { fontSize: 40, fontWeight: '600', letterSpacing: -1 },
  note: { fontSize: 26, lineHeight: 36 },
})
