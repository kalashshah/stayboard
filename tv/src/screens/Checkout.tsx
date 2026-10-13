import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import type { PropertyConfig } from '../types'
import { Card, Header, Mono, PAD, type Theme } from '../ui'

export function Checkout({ c, theme, onBack }: { c: PropertyConfig; theme: Theme; onBack: () => void }) {
  return (
    <View style={styles.wrap}>
      <Header theme={theme} title="Checkout" sub="Thanks for staying with us" onBack={onBack} />
      <View style={styles.body}>
        <View style={styles.left}>
          <Mono theme={theme}>Check-in</Mono>
          <Text style={[styles.time, { color: theme.ink }]}>{c.stay.checkIn}</Text>
          <View style={{ height: 15 }} />
          <Mono theme={theme}>Checkout</Mono>
          <Text style={[styles.time, { color: theme.accent }]}>{c.stay.checkOut}</Text>
        </View>
        <Card theme={theme} style={styles.right}>
          <Mono theme={theme}>Before you leave</Mono>
          {c.stay.checkoutSteps.length === 0 && <Text style={[styles.step, { color: theme.sub }]}>Nothing special. Just lock up.</Text>}
          {c.stay.checkoutSteps.map((s, i) => (
            <View key={i} style={styles.row}>
              <View style={[styles.num, { backgroundColor: theme.accent }]}><Text style={styles.numT}>{i + 1}</Text></View>
              <Text style={[styles.step, { color: theme.ink }]}>{s}</Text>
            </View>
          ))}
        </Card>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: PAD, paddingVertical: 28 },
  body: { flex: 1, flexDirection: 'row', gap: 30, alignItems: 'flex-start' },
  left: { flex: 0.8, gap: 3, paddingTop: 5 },
  time: { fontSize: 42, fontWeight: '600', letterSpacing: -1 },
  right: { flex: 1.3, gap: 11 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  num: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  numT: { color: '#fff', fontSize: 12, fontWeight: '700' },
  step: { fontSize: 16, lineHeight: 22, flex: 1 },
})
