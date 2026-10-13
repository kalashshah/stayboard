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
        {c.places.length === 0 && <Text style={{ color: theme.sub, fontSize: 14 }}>No local picks yet.</Text>}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: PAD, paddingVertical: 28 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: 285, gap: 4, minHeight: 115 },
  name: { fontSize: 20, fontWeight: '600', letterSpacing: -0.5 },
  note: { fontSize: 13, lineHeight: 18 },
})
