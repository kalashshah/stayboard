// Shared TV building blocks: theme from the config, focusable buttons, screen chrome.
import React, { useState } from 'react'
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import { Backdrop } from './Backdrop'
import { FONT, RADIUS, type PropertyConfig } from './types'

export type Theme = {
  accent: string; bg: string; ink: string; sub: string; tile: string; tileBorder: string; tileBorderWidth: number
  radius: number; font: string; fontBold: string; card: string; line: string; dark: boolean
}

export function themeFor(c?: PropertyConfig | null): Theme {
  const accent = c?.appearance.accent ?? '#c2562e'
  const dark = (c?.appearance.theme ?? 'dark') === 'dark'
  const d = c?.design
  const style = d?.tileStyle ?? 'glass'
  const tile = style === 'solid' ? (dark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.92)') : style === 'outline' ? 'transparent' : dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.8)'
  const tileBorder = style === 'outline' ? (dark ? 'rgba(255,255,255,0.45)' : 'rgba(28,28,28,0.3)') : style === 'glass' ? (dark ? 'rgba(255,255,255,0.14)' : 'rgba(28,28,28,0.08)') : 'transparent'
  const fonts = FONT[d?.font ?? 'sans']
  return {
    accent, dark, tile, tileBorder, tileBorderWidth: style === 'outline' ? 2 : 1,
    radius: RADIUS[d?.radius ?? 'rounded'], font: fonts.regular, fontBold: fonts.bold,
    bg: dark ? '#100e0d' : '#f7f2ee',
    ink: dark ? '#ffffff' : '#1c1c1c',
    sub: dark ? 'rgba(255,255,255,0.72)' : 'rgba(28,28,28,0.68)',
    card: dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.85)',
    line: dark ? 'rgba(255,255,255,0.14)' : 'rgba(28,28,28,0.12)',
  }
}

/** Full-screen chrome: the configured backdrop (or a flat color with an accent glow before pairing) under the content. */
export function Screen({ theme, c, children }: { theme: Theme; c?: PropertyConfig | null; children: React.ReactNode }) {
  return (
    <View style={[styles.screen, { backgroundColor: theme.bg }]}>
      {c ? <Backdrop c={c} theme={theme} /> : <View style={[styles.glow, { backgroundColor: theme.accent, opacity: theme.dark ? 0.32 : 0.18 }]} />}
      {children}
    </View>
  )
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
        <Text style={[styles.title, { color: theme.ink, fontFamily: theme.fontBold }]}>{title}</Text>
        {sub ? <Text style={[styles.sub, { color: theme.sub }]}>{sub}</Text> : null}
      </View>
    </View>
  )
}

export function Card({ theme, style, children }: { theme: Theme; style?: StyleProp<ViewStyle>; children: React.ReactNode }) {
  return <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.line }, style]}>{children}</View>
}

export const Mono = ({ children, theme, size = 22 }: { children: React.ReactNode; theme: Theme; size?: number }) => (
  <Text style={{ color: theme.sub, fontSize: size, letterSpacing: 1, textTransform: 'uppercase', fontWeight: '600' }}>{children}</Text>
)

export const PAD = 36

const styles = StyleSheet.create({
  screen: { flex: 1, width: '100%', height: '100%' },
  glow: { position: 'absolute', right: -150, top: -210, width: 550, height: 550, borderRadius: 550 },
  ring: { borderColor: '#ffffff' },
  back: { alignSelf: 'flex-start', borderWidth: 2, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 6, marginRight: 14 },
  backText: { fontSize: 13, fontWeight: '600' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  title: { fontSize: 30, letterSpacing: -0.5 },
  sub: { fontSize: 13, marginTop: 2 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16 },
})
