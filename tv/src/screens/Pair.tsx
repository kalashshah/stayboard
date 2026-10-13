import QRCode from '@amazon-devices/react-native-qrcode-svg'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Mono, Screen, themeFor } from '../ui'

export function Pair({ code, pairUrl, notice }: { code: string; pairUrl: string; notice: string }) {
  const theme = themeFor(null)
  const host = pairUrl.replace(/^https?:\/\//, '').split('/')[0]
  return (
    <Screen theme={theme}>
      <View style={styles.wrap}>
        <View style={styles.left}>
          <Text style={[styles.brand, { color: theme.ink }]}>Stayboard</Text>
          <Text style={[styles.h, { color: theme.ink }]}>Pair this TV with your property</Text>
          <Text style={[styles.p, { color: theme.sub }]}>
            On your phone or laptop, open <Text style={{ color: theme.ink, fontWeight: '600' }}>{host}/pair</Text>, sign in, and enter this code.
          </Text>
          <View style={[styles.codeBox, { borderColor: theme.accent }]}>
            <Text style={[styles.code, { color: theme.ink }]}>{code.split('').join(' ')}</Text>
          </View>
          <Text style={[styles.wait, { color: notice ? '#ff9b8a' : theme.sub }]}>{notice || 'Waiting for the code to be entered…'}</Text>
        </View>
        <View style={styles.right}>
          <View style={styles.qrCard}>
            <QRCode value={pairUrl} size={300} backgroundColor="#ffffff" color="#1c1c1c" />
          </View>
          <Mono theme={theme}>Scan to open the pairing page</Mono>
        </View>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 120, gap: 80 },
  left: { flex: 1.4, gap: 22 },
  right: { flex: 1, alignItems: 'center', gap: 20 },
  brand: { fontSize: 30, fontWeight: '600', letterSpacing: 4, textTransform: 'uppercase', opacity: 0.8 },
  h: { fontSize: 64, fontWeight: '600', letterSpacing: -1.5, lineHeight: 72 },
  p: { fontSize: 30, lineHeight: 42, maxWidth: 820 },
  codeBox: { alignSelf: 'flex-start', borderWidth: 4, borderRadius: 28, paddingHorizontal: 44, paddingVertical: 20, marginTop: 10 },
  code: { fontSize: 112, fontWeight: '700', letterSpacing: 6 },
  wait: { fontSize: 26 },
  qrCard: { backgroundColor: '#fff', padding: 28, borderRadius: 28 },
})
