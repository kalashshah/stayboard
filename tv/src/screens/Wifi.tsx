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
          <View style={{ height: 18 }} />
          <Mono theme={theme}>Password</Mono>
          <Text style={[styles.big, styles.pw, { color: theme.ink }]}>{c.wifi.password || '—'}</Text>
          <Text style={[styles.hint, { color: theme.sub }]}>Point your phone's camera at the code to join without typing.</Text>
        </View>
        {c.wifi.ssid ? (
          <Card theme={theme} style={styles.qrCard}>
            <View style={styles.qrInner}>
              <QRCode value={wifiQr(c)} size={190} backgroundColor="#ffffff" color="#1c1c1c" />
            </View>
          </Card>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: PAD, paddingVertical: 28 },
  body: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 40 },
  left: { flex: 1, gap: 4 },
  big: { fontSize: 38, fontWeight: '600', letterSpacing: -1 },
  pw: { letterSpacing: 1, fontFamily: 'monospace' },
  hint: { fontSize: 13, marginTop: 20, maxWidth: 350, lineHeight: 18 },
  qrCard: { padding: 12 },
  qrInner: { backgroundColor: '#fff', padding: 11, borderRadius: 9 },
})
