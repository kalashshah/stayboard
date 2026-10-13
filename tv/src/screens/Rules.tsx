import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import type { PropertyConfig } from '../types'
import { Header, PAD, type Theme } from '../ui'

export function Rules({ c, theme, onBack }: { c: PropertyConfig; theme: Theme; onBack: () => void }) {
  const half = Math.ceil(c.rules.length / 2)
  const cols = c.rules.length > 6 ? [c.rules.slice(0, half), c.rules.slice(half)] : [c.rules]
  return (
    <View style={styles.wrap}>
      <Header theme={theme} title="House rules" sub={`A few things ${c.hostName} asks of every guest`} onBack={onBack} />
      <View style={styles.cols}>
        {cols.map((col, ci) => (
          <View key={ci} style={styles.col}>
            {col.map((r, i) => (
              <View key={i} style={[styles.row, { borderColor: theme.line }]}>
                <View style={[styles.dot, { backgroundColor: theme.accent }]} />
                <Text style={[styles.rule, { color: theme.ink }]}>{r}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: PAD, paddingVertical: 56 },
  cols: { flexDirection: 'row', gap: 60 },
  col: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 22, paddingVertical: 22, borderBottomWidth: 1 },
  dot: { width: 16, height: 16, borderRadius: 8 },
  rule: { fontSize: 36, lineHeight: 46, flex: 1 },
})
