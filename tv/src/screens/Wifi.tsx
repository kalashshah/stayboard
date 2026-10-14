import QRCode from '@amazon-devices/react-native-qrcode-svg'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { wifiQr, type PropertyConfig } from '../types'
import { Chrome, Eyebrow, Fade, PAD, Panel, type Theme } from '../ui'

export function Wifi({ c, theme, onBack }: { c: PropertyConfig; theme: Theme; onBack: () => void }) {
  return (
    <Fade style={styles.wrap}>
      <Chrome c={c} theme={theme} title="Wi-Fi" sub="Join from any device" onBack={onBack} focusBack />
      <View style={styles.body}>
        <Panel theme={theme} style={styles.ticket}>
          <Eyebrow theme={theme}>Network</Eyebrow>
          <Text style={[styles.big, { color: theme.ink, fontFamily: theme.fontBold }]}>{c.wifi.ssid || 'Ask your host'}</Text>
          <View style={[styles.rule, { backgroundColor: theme.panelLine }]} />
          <Eyebrow theme={theme}>Password</Eyebrow>
          <View style={[styles.pwBox, { backgroundColor: theme.dark ? 'rgba(0,0,0,0.25)' : 'rgba(28,28,28,0.05)', borderColor: theme.panelLine }]}>
            <Text style={[styles.pw, { color: theme.ink }]}>{c.wifi.password || 'No password'}</Text>
          </View>
          <Text style={[styles.hint, { color: theme.sub, fontFamily: theme.font }]}>Capital letters matter. Or skip typing: point your phone's camera at the code.</Text>
        </Panel>
        {c.wifi.ssid ? (
          <View style={styles.qrCol}>
            <View style={styles.qrCard}>
              <QRCode value={wifiQr(c)} size={176} backgroundColor="#ffffff" color="#1c1c1c" />
            </View>
            <Text style={[styles.qrT, { color: theme.ink, fontFamily: theme.fontBold }]}>Point your camera here</Text>
            <Text style={[styles.qrS, { color: theme.sub, fontFamily: theme.font }]}>Your phone joins {c.wifi.ssid} on its own.</Text>
          </View>
        ) : null}
      </View>
    </Fade>
  )
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: PAD, paddingVertical: 24 },
  body: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 36 },
  ticket: { flex: 1, gap: 6, maxWidth: 520 },
  big: { fontSize: 34, letterSpacing: -1, lineHeight: 40 },
  rule: { height: 1, marginVertical: 12 },
  pwBox: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8, marginTop: 2 },
  pw: { fontSize: 30, letterSpacing: 2.5, fontFamily: 'monospace', fontWeight: '600' },
  hint: { fontSize: 12.5, marginTop: 14, maxWidth: 380, lineHeight: 17 },
  qrCol: { alignItems: 'center', gap: 4, width: 260 },
  qrCard: { backgroundColor: '#fff', padding: 14, borderRadius: 20, marginBottom: 8 },
  qrT: { fontSize: 15 },
  qrS: { fontSize: 12, textAlign: 'center' },
})
