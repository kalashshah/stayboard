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
            <QRCode value={pairUrl} size={150} backgroundColor="#ffffff" color="#1c1c1c" />
          </View>
          <Mono theme={theme}>Scan to open the pairing page</Mono>
        </View>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 60, gap: 40 },
  left: { flex: 1.4, gap: 11 },
  right: { flex: 1, alignItems: 'center', gap: 10 },
  brand: { fontSize: 15, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase', opacity: 0.8 },
  h: { fontSize: 32, fontWeight: '600', letterSpacing: -0.75, lineHeight: 36 },
  p: { fontSize: 15, lineHeight: 21, maxWidth: 410 },
  codeBox: { alignSelf: 'flex-start', borderWidth: 2, borderRadius: 14, paddingHorizontal: 22, paddingVertical: 10, marginTop: 5 },
  code: { fontSize: 56, fontWeight: '700', letterSpacing: 3 },
  wait: { fontSize: 13 },
  qrCard: { backgroundColor: '#fff', padding: 14, borderRadius: 14 },
})
