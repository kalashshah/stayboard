import QRCode from '@amazon-devices/react-native-qrcode-svg'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Dots, Eyebrow, Fade, Panel, Screen, themeFor } from '../ui'

export function Pair({ code, pairUrl, notice }: { code: string; pairUrl: string; notice: string }) {
  const theme = themeFor(null)
  const host = pairUrl.replace(/^https?:\/\//, '').split('/')[0]
  const steps = [`Open ${host}/pair on your phone or laptop`, 'Sign in and pick the property', 'Type the six letters below']
  return (
    <Screen theme={theme}>
      <Fade style={styles.wrap}>
        <View style={styles.left}>
          <View style={styles.brandRow}>
            <View style={[styles.mark, { backgroundColor: theme.ink }]}><View style={[styles.markDot, { backgroundColor: theme.accent }]} /></View>
            <Text style={[styles.brand, { color: theme.ink, fontFamily: theme.fontBold }]}>Stayboard</Text>
          </View>
          <Text style={[styles.h, { color: theme.ink, fontFamily: theme.fontBold }]}>Pair this TV</Text>
          <View style={styles.steps}>
            {steps.map((s, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={[styles.num, { borderColor: theme.accent }]}><Text style={[styles.numT, { color: theme.accent }]}>{i + 1}</Text></View>
                <Text style={[styles.step, { color: theme.sub, fontFamily: theme.font }]}>{s}</Text>
              </View>
            ))}
          </View>
          <View style={styles.keys}>
            {code.split('').map((ch, i) => (
              <Panel key={i} theme={theme} style={styles.key}><Text style={[styles.keyT, { color: theme.ink }]}>{ch}</Text></Panel>
            ))}
          </View>
          <View style={styles.status}>
            {!notice && <Dots theme={theme} />}
            <Text style={[styles.wait, { color: notice ? '#ff9b8a' : theme.sub, fontFamily: theme.font }]}>{notice || 'Waiting for the code…'}</Text>
          </View>
        </View>
        <View style={styles.right}>
          <View style={styles.qrCard}>
            <QRCode value={pairUrl} size={150} backgroundColor="#ffffff" color="#1c1c1c" />
          </View>
          <Eyebrow theme={theme} style={{ textAlign: 'center' }}>Scan to open the pairing page</Eyebrow>
        </View>
      </Fade>
    </Screen>
  )
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 64, gap: 48 },
  left: { flex: 1.5, gap: 14 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mark: { width: 20, height: 20, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  markDot: { width: 7, height: 7, borderRadius: 4 },
  brand: { fontSize: 15, letterSpacing: -0.2 },
  h: { fontSize: 40, letterSpacing: -1.2, lineHeight: 44 },
  steps: { gap: 8, marginTop: 2 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  num: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  numT: { fontSize: 11, fontWeight: '700' },
  step: { fontSize: 14.5 },
  keys: { flexDirection: 'row', gap: 8, marginTop: 8 },
  key: { width: 56, height: 68, padding: 0, alignItems: 'center', justifyContent: 'center' },
  keyT: { fontSize: 34, fontWeight: '700', letterSpacing: 1 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  wait: { fontSize: 13 },
  right: { flex: 1, alignItems: 'center', gap: 12 },
  qrCard: { backgroundColor: '#fff', padding: 14, borderRadius: 20 },
})
