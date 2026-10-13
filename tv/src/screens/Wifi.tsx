import QRCode from '@amazon-devices/react-native-qrcode-svg'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { wifiQr, type PropertyConfig } from '../types'
import { Card, Header, Mono, PAD, type Theme } from '../ui'

export function Wifi({ c, theme, onBack }: { c: PropertyConfig; theme: Theme; onBack: () => void }) {
  return (
    <View style={styles.wrap}>
      <Header theme={theme} title="Wi-Fi" sub="Join from any device" onBack={onBack} />
      <View style={styles.body}>
        <View style={styles.left}>
          <Mono theme={theme}>Network</Mono>
          <Text style={[styles.big, { color: theme.ink }]}>{c.wifi.ssid || 'Ask your host'}</Text>
          <View style={{ height: 36 }} />
          <Mono theme={theme}>Password</Mono>
          <Text style={[styles.big, styles.pw, { color: theme.ink }]}>{c.wifi.password || '—'}</Text>
          <Text style={[styles.hint, { color: theme.sub }]}>Point your phone's camera at the code to join without typing.</Text>
        </View>
        {c.wifi.ssid ? (
          <Card theme={theme} style={styles.qrCard}>
            <View style={styles.qrInner}>
              <QRCode value={wifiQr(c)} size={380} backgroundColor="#ffffff" color="#1c1c1c" />
            </View>
          </Card>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: PAD, paddingVertical: 56 },
  body: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 80 },
  left: { flex: 1, gap: 8 },
  big: { fontSize: 76, fontWeight: '600', letterSpacing: -2 },
  pw: { letterSpacing: 2, fontFamily: 'monospace' },
  hint: { fontSize: 26, marginTop: 40, maxWidth: 700, lineHeight: 36 },
  qrCard: { padding: 24 },
  qrInner: { backgroundColor: '#fff', padding: 22, borderRadius: 18 },
})
