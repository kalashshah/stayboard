import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import type { PropertyConfig } from '../types'
import { Card, Header, Mono, PAD, type Theme } from '../ui'

export function Contacts({ c, theme, onBack }: { c: PropertyConfig; theme: Theme; onBack: () => void }) {
  return (
    <View style={styles.wrap}>
      <Header theme={theme} title="Contacts" sub="We're a message away" onBack={onBack} />
      <View style={styles.grid}>
        {c.contacts.map((k, i) => (
          <Card key={i} theme={theme} style={styles.card}>
            <Mono theme={theme}>{k.label}</Mono>
            <Text style={[styles.v, { color: theme.ink }]}>{k.value}</Text>
          </Card>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: PAD, paddingVertical: 28 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: 430, gap: 5 },
  v: { fontSize: 24, fontWeight: '600', letterSpacing: -0.5 },
})
