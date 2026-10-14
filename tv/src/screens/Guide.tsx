import { TVFocusGuideView } from '@amazon-devices/react-native-kepler'
import React, { useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import type { PropertyConfig } from '../types'
import { Chip, Chrome, Fade, Focusable, PAD, Panel, type Theme } from '../ui'

export function Guide({ c, theme, onBack }: { c: PropertyConfig; theme: Theme; onBack: () => void }) {
  const topics = [...c.guide.map((g) => ({ title: g.title, body: g.body, faq: false })), ...c.faqs.map((f) => ({ title: f.q, body: f.a, faq: true }))]
  const [i, setI] = useState(0)
  const t = topics[i]
  return (
    <Fade style={styles.wrap}>
      <Chrome c={c} theme={theme} title="House guide" sub="How things work around here" onBack={onBack} />
      <View style={styles.body}>
        <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 8 }}>
          <TVFocusGuideView autoFocus>
            {topics.map((x, idx) => (
              <Focusable
                key={idx}
                theme={theme}
                lift={1.02}
                hasTVPreferredFocus={idx === 0}
                onPress={() => setI(idx)}
                style={[styles.item, { backgroundColor: idx === i ? theme.panel : 'transparent', borderColor: idx === i ? theme.panelLine : 'transparent' }]}>
                {(f) => (
                  <View style={styles.itemRow}>
                    <View style={[styles.mark, { backgroundColor: idx === i || f ? theme.accent : 'transparent' }]} />
                    <Text style={[styles.itemT, { color: theme.ink, fontFamily: idx === i ? theme.fontBold : theme.font }]} numberOfLines={2}>{x.title}</Text>
                  </View>
                )}
              </Focusable>
            ))}
            {topics.length === 0 && <Text style={{ color: theme.sub, fontSize: 14, fontFamily: theme.font }}>The host hasn't added guide topics yet.</Text>}
          </TVFocusGuideView>
        </ScrollView>
        {t && (
          <Panel theme={theme} style={styles.detail}>
            <Chip theme={theme}>{t.faq ? 'Guests often ask' : 'How it works'}</Chip>
            <Text style={[styles.h, { color: theme.ink, fontFamily: theme.fontBold }]}>{t.title}</Text>
            <ScrollView style={{ maxHeight: 230, flexGrow: 0 }}>
              <Text style={[styles.p, { color: theme.ink, fontFamily: theme.font }]}>{t.body}</Text>
            </ScrollView>
          </Panel>
        )}
      </View>
    </Fade>
  )
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: PAD, paddingVertical: 24 },
  body: { flex: 1, flexDirection: 'row', gap: 22, alignItems: 'flex-start' },
  list: { width: 320, maxHeight: 360 },
  item: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, marginBottom: 4 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: { width: 4, height: 18, borderRadius: 2 },
  itemT: { fontSize: 15, flex: 1 },
  detail: { flex: 1, gap: 10, alignSelf: 'flex-start' },
  h: { fontSize: 24, letterSpacing: -0.5, lineHeight: 29 },
  p: { fontSize: 16, lineHeight: 24 },
})
