import { TVFocusGuideView } from '@amazon-devices/react-native-kepler'
import React, { useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import type { PropertyConfig } from '../types'
import { Card, Focusable, Header, Mono, PAD, type Theme } from '../ui'

export function Guide({ c, theme, onBack }: { c: PropertyConfig; theme: Theme; onBack: () => void }) {
  const topics = [...c.guide.map((g) => ({ title: g.title, body: g.body })), ...c.faqs.map((f) => ({ title: f.q, body: f.a }))]
  const [i, setI] = useState(0)
  const t = topics[i]
  return (
    <View style={styles.wrap}>
      <Header theme={theme} title="House guide" sub="How things work around here" onBack={onBack} />
      <View style={styles.body}>
        <TVFocusGuideView autoFocus style={styles.list}>
          <ScrollView>
            {topics.map((x, idx) => (
              <Focusable
                key={idx}
                onPress={() => setI(idx)}
                style={[styles.item, { borderColor: 'transparent', backgroundColor: idx === i ? theme.card : 'transparent' }]}
                focusStyle={{ backgroundColor: theme.accent }}>
                {(f) => <Text style={[styles.itemT, { color: f ? '#fff' : theme.ink }]} numberOfLines={2}>{x.title}</Text>}
              </Focusable>
            ))}
            {topics.length === 0 && <Text style={{ color: theme.sub, fontSize: 28 }}>The host hasn't added guide topics yet.</Text>}
          </ScrollView>
        </TVFocusGuideView>
        {t && (
          <Card theme={theme} style={styles.detail}>
            <Mono theme={theme}>{i < c.guide.length ? 'Topic' : 'FAQ'}</Mono>
            <Text style={[styles.h, { color: theme.ink }]}>{t.title}</Text>
            <ScrollView style={{ flex: 1 }}>
              <Text style={[styles.p, { color: theme.ink }]}>{t.body}</Text>
            </ScrollView>
          </Card>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: PAD, paddingVertical: 56 },
  body: { flex: 1, flexDirection: 'row', gap: 40 },
  list: { width: 620 },
  item: { borderWidth: 3, borderRadius: 18, paddingHorizontal: 22, paddingVertical: 18, marginBottom: 8 },
  itemT: { fontSize: 30, fontWeight: '500' },
  detail: { flex: 1, gap: 14 },
  h: { fontSize: 48, fontWeight: '600', letterSpacing: -1 },
  p: { fontSize: 30, lineHeight: 44 },
})
