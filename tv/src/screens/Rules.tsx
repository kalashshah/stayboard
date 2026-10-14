import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import type { PropertyConfig } from '../types'
import { Chrome, Eyebrow, Fade, PAD, Panel, type Theme } from '../ui'

export function Rules({ c, theme, onBack }: { c: PropertyConfig; theme: Theme; onBack: () => void }) {
  const half = Math.ceil(c.rules.length / 2)
  const cols = c.rules.length > 5 ? [c.rules.slice(0, half), c.rules.slice(half)] : [c.rules]
  return (
    <Fade style={styles.wrap}>
      <Chrome c={c} theme={theme} title="House rules" sub={`A few things ${c.hostName} asks of every guest`} onBack={onBack} focusBack />
      <Panel theme={theme} style={styles.panel}>
        <Eyebrow theme={theme}>{c.rules.length} {c.rules.length === 1 ? 'rule' : 'rules'}</Eyebrow>
        <View style={styles.cols}>
          {cols.map((col, ci) => (
            <View key={ci} style={styles.col}>
              {col.map((r, i) => (
                <View key={i} style={[styles.row, i < col.length - 1 && { borderBottomWidth: 1, borderColor: theme.panelLine }]}>
                  <View style={[styles.dot, { backgroundColor: theme.accent }]} />
                  <Text style={[styles.rule, { color: theme.ink, fontFamily: theme.font }]}>{r}</Text>
                </View>
              ))}
            </View>
          ))}
          {c.rules.length === 0 && <Text style={[styles.rule, { color: theme.sub, fontFamily: theme.font }]}>No rules. Enjoy the place like it's yours.</Text>}
        </View>
      </Panel>
    </Fade>
  )
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: PAD, paddingVertical: 24 },
  panel: { alignSelf: 'stretch', paddingTop: 18, paddingBottom: 8 },
  cols: { flexDirection: 'row', gap: 40, marginTop: 4 },
  col: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  rule: { fontSize: 17, lineHeight: 23, flex: 1 },
})
