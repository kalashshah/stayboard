// Shared TV building blocks: theme from the config, focusable buttons, screen chrome.
import React, { useState } from 'react'
import { ImageBackground, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import type { PropertyConfig } from './types'

export type Theme = { accent: string; bg: string; ink: string; sub: string; tile: string; tileFocus: string; card: string; line: string; dark: boolean }

export function themeFor(c?: PropertyConfig | null): Theme {
  const accent = c?.appearance.accent ?? '#c2562e'
  const dark = (c?.appearance.theme ?? 'dark') === 'dark'
  return dark
    ? { accent, bg: '#100e0d', ink: '#ffffff', sub: 'rgba(255,255,255,0.72)', tile: 'rgba(255,255,255,0.08)', tileFocus: accent, card: 'rgba(255,255,255,0.07)', line: 'rgba(255,255,255,0.14)', dark }
    : { accent, bg: '#f7f2ee', ink: '#1c1c1c', sub: 'rgba(28,28,28,0.68)', tile: 'rgba(255,255,255,0.8)', tileFocus: accent, card: 'rgba(255,255,255,0.85)', line: 'rgba(28,28,28,0.12)', dark }
}

/** Full-screen background: photo if set, else flat color with an accent glow. */
export function Screen({ theme, photo, children }: { theme: Theme; photo?: string; children: React.ReactNode }) {
  const body = (
    <View style={[styles.screen, { backgroundColor: photo ? 'transparent' : theme.bg }]}>
      {!photo && <View style={[styles.glow, { backgroundColor: theme.accent, opacity: theme.dark ? 0.32 : 0.18 }]} />}
      {photo && <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.55)' }]} />}
      {children}
    </View>
  )
  return photo ? <ImageBackground source={{ uri: photo }} style={styles.screen} resizeMode="cover">{body}</ImageBackground> : body
}

export function Focusable({
  onPress, style, focusStyle, children, hasTVPreferredFocus, accent, testID,
}: {
  onPress?: () => void; style?: StyleProp<ViewStyle>; focusStyle?: StyleProp<ViewStyle>; children: React.ReactNode | ((focused: boolean) => React.ReactNode)
  hasTVPreferredFocus?: boolean; accent?: string; testID?: string
}) {
  const [focused, setFocused] = useState(false)
  return (
    <Pressable
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      hasTVPreferredFocus={hasTVPreferredFocus}
      testID={testID}
      accessibilityRole="button"
      style={[style, focused && styles.ring, focused && focusStyle, focused && accent ? { borderColor: '#fff' } : null]}>
      {typeof children === 'function' ? children(focused) : children}
    </Pressable>
  )
}

export function BackButton({ theme, onPress }: { theme: Theme; onPress: () => void }) {
  return (
    <Focusable onPress={onPress} style={[styles.back, { borderColor: theme.line }]} focusStyle={{ backgroundColor: theme.ink }}>
      {(f) => <Text style={[styles.backText, { color: f ? theme.bg : theme.ink }]}>←  Back</Text>}
    </Focusable>
  )
}

export function Header({ theme, title, sub, onBack }: { theme: Theme; title: string; sub?: string; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <BackButton theme={theme} onPress={onBack} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: theme.ink }]}>{title}</Text>
        {sub ? <Text style={[styles.sub, { color: theme.sub }]}>{sub}</Text> : null}
      </View>
    </View>
  )
}

export function Card({ theme, style, children }: { theme: Theme; style?: StyleProp<ViewStyle>; children: React.ReactNode }) {
  return <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.line }, style]}>{children}</View>
}

export const Mono = ({ children, theme, size = 22 }: { children: React.ReactNode; theme: Theme; size?: number }) => (
  <Text style={{ color: theme.sub, fontSize: size, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600' }}>{children}</Text>
)

export const PAD = 72

const styles = StyleSheet.create({
  screen: { flex: 1, width: '100%', height: '100%' },
  glow: { position: 'absolute', right: -300, top: -420, width: 1100, height: 1100, borderRadius: 550 },
  ring: { borderColor: '#ffffff' },
  back: { alignSelf: 'flex-start', borderWidth: 3, borderRadius: 999, paddingHorizontal: 26, paddingVertical: 12, marginRight: 28 },
  backText: { fontSize: 26, fontWeight: '600' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 36 },
  title: { fontSize: 60, fontWeight: '600', letterSpacing: -1 },
  sub: { fontSize: 26, marginTop: 4 },
  card: { borderRadius: 28, borderWidth: 1, padding: 32 },
})
