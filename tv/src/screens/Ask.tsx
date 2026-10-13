import { TVFocusGuideView } from '@amazon-devices/react-native-kepler'
import QRCode from '@amazon-devices/react-native-qrcode-svg'
import React, { useState } from 'react'
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { askHouse } from '../api'
import type { Answer, PropertyConfig } from '../types'
import { Card, Focusable, Header, Mono, PAD, type Theme } from '../ui'

// Vega-only TextInput props (TV keyboard title + size); kept as a loose object so the RN types stay happy.
const tvKeyboard = { auxOptions: 'title:Ask the house', keyboardUiMode: 'half-screen' } as object

export function Ask({ c, theme, onBack, secret, guestUrl }: { c: PropertyConfig; theme: Theme; onBack: () => void; secret: string; guestUrl: string }) {
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [last, setLast] = useState<{ q: string; r: Answer } | null>(null)

  const send = async (question: string) => {
    const t = question.trim()
    if (!t || busy) return
    setBusy(true)
    try {
      const r = await askHouse(secret, t)
      setLast({ q: t, r })
      setQ('')
    } catch {
      setLast({ q: t, r: { answered: false, answer: `I couldn't reach the concierge just now. ${c.ask.fallback}` } })
    } finally {
      setBusy(false)
    }
  }

  return (
    <View style={styles.wrap}>
      <Header theme={theme} title="Ask the house" sub={`Answers come from ${c.hostName}'s house guide`} onBack={onBack} />
      <View style={styles.body}>
        <View style={styles.left}>
          <TextInput
            {...tvKeyboard}
            value={q}
            onChangeText={setQ}
            placeholder="Type a question, e.g. Is there a hair dryer?"
            placeholderTextColor={theme.sub}
            returnKeyType="search"
            onSubmitEditing={() => send(q)}
            style={[styles.input, { color: theme.ink, borderColor: theme.line, backgroundColor: theme.card }]}
            testID="ask-input"
          />
          {c.ask.suggested.length > 0 && (
            <TVFocusGuideView autoFocus style={styles.chips}>
              {c.ask.suggested.slice(0, 4).map((s, i) => (
                <Focusable key={s} hasTVPreferredFocus={i === 0} onPress={() => send(s)} style={[styles.chip, { borderColor: theme.line, backgroundColor: theme.card }]} focusStyle={{ backgroundColor: theme.accent }}>
                  {(f) => <Text style={[styles.chipT, { color: f ? '#fff' : theme.ink }]}>{s}</Text>}
                </Focusable>
              ))}
            </TVFocusGuideView>
          )}
          <Card theme={theme} style={styles.answer}>
            {busy ? (
              <Text style={[styles.a, { color: theme.sub }]}>Checking the house guide…</Text>
            ) : last ? (
              <>
                <Mono theme={theme}>You asked</Mono>
                <Text style={[styles.qText, { color: theme.sub }]}>“{last.q}”</Text>
                <ScrollView style={{ flex: 1 }}>
                  <Text style={[styles.a, { color: theme.ink }]}>{last.r.answer}</Text>
                </ScrollView>
                {!last.r.answered && <Text style={[styles.note, { color: theme.sub }]}>Your host has been notified so they can add this to the guide.</Text>}
              </>
            ) : (
              <Text style={[styles.a, { color: theme.sub }]}>Pick a question above, or select the box to type your own.</Text>
            )}
          </Card>
        </View>
        <View style={styles.right}>
          <View style={styles.qrCard}>
            <QRCode value={guestUrl} size={260} backgroundColor="#ffffff" color="#1c1c1c" />
          </View>
          <Text style={[styles.qrT, { color: theme.ink }]}>Prefer your phone?</Text>
          <Text style={[styles.qrS, { color: theme.sub }]}>Scan to read the guide and ask from there.</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: PAD, paddingVertical: 56 },
  body: { flex: 1, flexDirection: 'row', gap: 60 },
  left: { flex: 1, gap: 20 },
  right: { width: 380, alignItems: 'center', gap: 10, paddingTop: 10 },
  input: { fontSize: 32, borderWidth: 3, borderRadius: 22, paddingHorizontal: 28, paddingVertical: 22 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  chip: { borderWidth: 3, borderRadius: 999, paddingHorizontal: 22, paddingVertical: 12 },
  chipT: { fontSize: 24, fontWeight: '500' },
  answer: { flex: 1, gap: 10 },
  qText: { fontSize: 26 },
  a: { fontSize: 34, lineHeight: 48 },
  note: { fontSize: 22 },
  qrCard: { backgroundColor: '#fff', padding: 20, borderRadius: 24 },
  qrT: { fontSize: 28, fontWeight: '600', marginTop: 10 },
  qrS: { fontSize: 22, textAlign: 'center' },
})
