import { TVFocusGuideView } from '@amazon-devices/react-native-kepler'
import QRCode from '@amazon-devices/react-native-qrcode-svg'
import React, { useState } from 'react'
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { askHouse } from '../api'
import type { Answer, PropertyConfig, Reply } from '../types'
import { Chip, Chrome, Dots, Eyebrow, Fade, Focusable, PAD, Panel, type Theme } from '../ui'

// Vega-only TextInput props (TV keyboard title + size); kept as a loose object so the RN types stay happy.
const tvKeyboard = { auxOptions: 'title:Ask the house', keyboardUiMode: 'half-screen' } as object

export function Ask({ c, theme, onBack, secret, guestUrl, replies }: { c: PropertyConfig; theme: Theme; onBack: () => void; secret: string; guestUrl: string; replies: Reply[] }) {
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [last, setLast] = useState<{ q: string; r: Answer } | null>(null)

  const host = c.hostName || 'Your host'
  // The host's reply to the question on screen, or else the newest reply, so a guest who walked away still finds it.
  const reply = last ? replies.find((r) => r.id === last.r.id) : replies[0]

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
    <Fade style={styles.wrap}>
      <Chrome c={c} theme={theme} title="Ask the house" sub={`Answers come from ${c.hostName}'s house guide, nothing else`} onBack={onBack} />
      <View style={styles.body}>
        <View style={styles.left}>
          <View style={[styles.inputWrap, { backgroundColor: theme.panel, borderColor: theme.panelLine }]}>
            <Text style={[styles.inputGlyph, { color: theme.accent }]}>?</Text>
            <TextInput
              {...tvKeyboard}
              value={q}
              onChangeText={setQ}
              placeholder="Type a question, e.g. Is there a hair dryer?"
              placeholderTextColor={theme.faint}
              returnKeyType="search"
              onSubmitEditing={() => send(q)}
              style={[styles.input, { color: theme.ink, fontFamily: theme.font }]}
              testID="ask-input"
            />
          </View>
          {c.ask.suggested.length > 0 && (
            <TVFocusGuideView autoFocus style={styles.chips}>
              {c.ask.suggested.slice(0, 4).map((s, i) => (
                <Focusable key={s} theme={theme} hasTVPreferredFocus={i === 0} onPress={() => send(s)} style={[styles.chip, { borderColor: theme.panelLine, backgroundColor: theme.panel }]}>
                  <Text style={[styles.chipT, { color: theme.ink, fontFamily: theme.font }]}>{s}</Text>
                </Focusable>
              ))}
            </TVFocusGuideView>
          )}
          <Panel theme={theme} style={[styles.answer, { borderLeftColor: last ? theme.accent : theme.panelLine }]}>
            {busy ? (
              <View style={styles.thinking}>
                <Dots theme={theme} />
                <Text style={[styles.hint, { color: theme.sub, fontFamily: theme.font }]}>Checking the house guide…</Text>
              </View>
            ) : last ? (
              <>
                <Text style={[styles.qText, { color: theme.sub, fontFamily: theme.font }]}>“{last.q}”</Text>
                <ScrollView style={{ maxHeight: 150, flexGrow: 0 }}>
                  <Text style={[styles.a, { color: theme.ink, fontFamily: theme.font }]}>{last.r.answer}</Text>
                </ScrollView>
                {reply ? (
                  <ReplyView theme={theme} host={host} text={reply.reply} />
                ) : (
                  <View style={styles.answerFoot}>
                    <Eyebrow theme={theme}>{last.r.answered ? `From ${c.hostName}'s house guide` : 'Not in the guide yet'}</Eyebrow>
                    {!last.r.answered && <Chip theme={theme}>{last.r.id ? `${host} will reply here` : 'Your host has been told'}</Chip>}
                  </View>
                )}
              </>
            ) : reply ? (
              <>
                <Text style={[styles.qText, { color: theme.sub, fontFamily: theme.font }]}>“{reply.question}”</Text>
                <ReplyView theme={theme} host={host} text={reply.reply} />
              </>
            ) : (
              <Text style={[styles.hint, { color: theme.sub, fontFamily: theme.font }]}>Pick a question, or move up to the box and type your own.</Text>
            )}
          </Panel>
        </View>
        <View style={styles.right}>
          <View style={styles.qrCard}>
            <QRCode value={guestUrl} size={126} backgroundColor="#ffffff" color="#1c1c1c" />
          </View>
          <Text style={[styles.qrT, { color: theme.ink, fontFamily: theme.fontBold }]}>Prefer your phone?</Text>
          <Text style={[styles.qrS, { color: theme.sub, fontFamily: theme.font }]}>Scan to read the guide and ask from there.</Text>
        </View>
      </View>
    </Fade>
  )
}

const ReplyView = ({ theme, host, text }: { theme: Theme; host: string; text: string }) => (
  <View style={[styles.reply, { borderLeftColor: theme.accent }]}>
    <Eyebrow theme={theme}>{`${host} replied`}</Eyebrow>
    <ScrollView style={{ maxHeight: 120, flexGrow: 0 }}>
      <Text style={[styles.a, { color: theme.ink, fontFamily: theme.font }]}>{text}</Text>
    </ScrollView>
  </View>
)

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: PAD, paddingVertical: 24 },
  body: { flex: 1, flexDirection: 'row', gap: 28, alignItems: 'flex-start' },
  left: { flex: 1, gap: 10 },
  right: { width: 180, alignItems: 'center', gap: 4, paddingTop: 4 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 999, paddingLeft: 16, paddingRight: 8 },
  inputGlyph: { fontSize: 18, fontWeight: '700' },
  input: { flex: 1, fontSize: 15.5, paddingVertical: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  chipT: { fontSize: 12.5 },
  answer: { alignSelf: 'stretch', gap: 8, borderLeftWidth: 3, padding: 18 },
  thinking: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hint: { fontSize: 14, lineHeight: 20 },
  qText: { fontSize: 13 },
  a: { fontSize: 17, lineHeight: 25 },
  reply: { gap: 4, borderLeftWidth: 2, paddingLeft: 12, marginTop: 4 },
  answerFoot: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  qrCard: { backgroundColor: '#fff', padding: 10, borderRadius: 16, marginBottom: 6 },
  qrT: { fontSize: 14 },
  qrS: { fontSize: 11.5, textAlign: 'center', lineHeight: 16 },
})
