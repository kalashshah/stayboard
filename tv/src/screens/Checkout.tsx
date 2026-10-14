import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import type { PropertyConfig } from '../types'
import { Chrome, Eyebrow, Fade, PAD, Panel, type Theme } from '../ui'

export function Checkout({ c, theme, onBack }: { c: PropertyConfig; theme: Theme; onBack: () => void }) {
  const steps = c.stay.checkoutSteps
  return (
    <Fade style={styles.wrap}>
      <Chrome c={c} theme={theme} title="Your stay" sub="Check-in, checkout and what to do before you go" onBack={onBack} focusBack />
      <View style={styles.body}>
        <View style={styles.times}>
          <Panel theme={theme} style={styles.time}>
            <Eyebrow theme={theme}>Check-in</Eyebrow>
            <Text style={[styles.t, { color: theme.ink, fontFamily: theme.fontBold }]}>{c.stay.checkIn}</Text>
          </Panel>
          <Panel theme={theme} style={styles.time}>
            <Eyebrow theme={theme}>Checkout</Eyebrow>
            <Text style={[styles.t, { color: theme.accent, fontFamily: theme.fontBold }]}>{c.stay.checkOut}</Text>
          </Panel>
          <Text style={[styles.thanks, { color: theme.sub, fontFamily: theme.font }]}>Thanks for staying with {c.hostName}.</Text>
        </View>
        <Panel theme={theme} style={styles.list}>
          <Eyebrow theme={theme}>Before you leave</Eyebrow>
          <ScrollView style={{ marginTop: 6, flexGrow: 0 }}>
            {steps.length === 0 && <Text style={[styles.step, { color: theme.sub, fontFamily: theme.font }]}>Nothing special. Just lock up and travel safe.</Text>}
            {steps.map((s, i) => (
              <View key={i} style={[styles.row, i < steps.length - 1 && { borderBottomWidth: 1, borderColor: theme.panelLine }]}>
                <View style={[styles.num, { borderColor: theme.accent }]}><Text style={[styles.numT, { color: theme.accent }]}>{i + 1}</Text></View>
                <Text style={[styles.step, { color: theme.ink, fontFamily: theme.font }]}>{s}</Text>
              </View>
            ))}
          </ScrollView>
        </Panel>
      </View>
    </Fade>
  )
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: PAD, paddingVertical: 24 },
  body: { flex: 1, flexDirection: 'row', gap: 20, alignItems: 'flex-start' },
  times: { width: 250, gap: 12 },
  time: { gap: 4, paddingVertical: 18 },
  t: { fontSize: 34, letterSpacing: -1, lineHeight: 38 },
  thanks: { fontSize: 12.5, paddingHorizontal: 4 },
  list: { flex: 1, maxHeight: 360, paddingTop: 18, paddingBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 11 },
  num: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  numT: { fontSize: 12, fontWeight: '700' },
  step: { fontSize: 16, lineHeight: 22, flex: 1 },
})
