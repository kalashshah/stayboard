// Shared TV building blocks: theme from the config, screen chrome, glass panels, animated focus, chips.
import React, { useEffect, useRef, useState } from 'react'
import { Animated, Image, Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native'
import { Backdrop } from './Backdrop'
import { FONT, RADIUS, type PropertyConfig } from './types'

export type Theme = {
  accent: string; bg: string; ink: string; sub: string; faint: string
  tile: string; tileBorder: string; tileBorderWidth: number; radius: number
  font: string; fontBold: string
  panel: string; panelLine: string; focusFill: string; chip: string; dark: boolean
}

/** "#c2562e" → "rgba(194,86,46,a)" */
export function tint(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
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
    bg: dark ? '#0e0c0b' : '#f6f1ec',
    ink: dark ? '#ffffff' : '#1c1c1c',
    sub: dark ? 'rgba(255,255,255,0.68)' : 'rgba(28,28,28,0.64)',
    faint: dark ? 'rgba(255,255,255,0.42)' : 'rgba(28,28,28,0.42)',
    panel: dark ? 'rgba(255,255,255,0.065)' : 'rgba(255,255,255,0.72)',
    panelLine: dark ? 'rgba(255,255,255,0.09)' : 'rgba(28,28,28,0.08)',
    focusFill: tint(accent, dark ? 0.3 : 0.2),
    chip: tint(accent, dark ? 0.26 : 0.16),
  }
}

/** Full-screen chrome: the configured backdrop under the content; `dim` adds tint while a sub-screen is open. */
export function Screen({ theme, c, dim, children }: { theme: Theme; c?: PropertyConfig | null; dim?: boolean; children: React.ReactNode }) {
  return (
    <View style={[styles.screen, { backgroundColor: theme.bg }]}>
      <Backdrop c={c ?? null} theme={theme} />
      {dim ? <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.dark ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.28)' }]} pointerEvents="none" /> : null}
      {children}
    </View>
  )
}

/** Mounts with a short fade so screen changes feel placed rather than swapped. */
export function Fade({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const o = useRef(new Animated.Value(0)).current
  useEffect(() => { Animated.timing(o, { toValue: 1, duration: 220, useNativeDriver: true }).start() }, [])
  return <Animated.View style={[{ flex: 1, opacity: o }, style]}>{children}</Animated.View>
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

/** Focus lifts the element: spring scale, accent-tinted fill and ring. Pass `focusStyle` to override (e.g. solid accent). */
export function Focusable({
  theme, onPress, style, focusStyle, children, hasTVPreferredFocus, testID, lift = 1.03,
}: {
  theme: Theme; onPress?: () => void; style?: StyleProp<ViewStyle>; focusStyle?: StyleProp<ViewStyle>
  children: React.ReactNode | ((focused: boolean) => React.ReactNode); hasTVPreferredFocus?: boolean; testID?: string; lift?: number
}) {
  const [focused, setFocused] = useState(false)
  const scale = useRef(new Animated.Value(1)).current
  const go = (to: number) => Animated.spring(scale, { toValue: to, useNativeDriver: true, speed: 24, bounciness: 5 }).start()
  return (
    <AnimatedPressable
      onPress={onPress}
      onFocus={() => { setFocused(true); go(lift) }}
      onBlur={() => { setFocused(false); go(1) }}
      hasTVPreferredFocus={hasTVPreferredFocus}
      testID={testID}
      accessibilityRole="button"
      style={[style, focused && (focusStyle ?? { backgroundColor: theme.focusFill, borderColor: theme.accent }), { transform: [{ scale }] }]}>
      {typeof children === 'function' ? children(focused) : children}
    </AnimatedPressable>
  )
}

export function clock() {
  const d = new Date()
  const h = d.getHours()
  const m = d.getMinutes().toString().padStart(2, '0')
  return `${h % 12 || 12}:${m} ${h < 12 ? 'AM' : 'PM'}`
}

export function useClock() {
  const [time, setTime] = useState(clock())
  useEffect(() => {
    const id = setInterval(() => setTime(clock()), 15_000)
    return () => clearInterval(id)
  }, [])
  return time
}

/** Property name or logo on the left, clock on the right: the same top row on every screen. */
export function TopRow({ c, theme, notice }: { c: PropertyConfig; theme: Theme; notice?: string }) {
  const time = useClock()
  return (
    <View style={styles.topRow}>
      {c.design.logo
        ? <Image source={{ uri: c.design.logo }} style={styles.logo} resizeMode="contain" />
        : <Text style={[styles.brand, { color: theme.sub, fontFamily: theme.fontBold }]}>{c.name}</Text>}
      <Text style={[styles.clock, { color: theme.sub, fontFamily: theme.font }]}>{notice ? `${notice}  ·  ` : ''}{c.design.showClock ? time : ''}</Text>
    </View>
  )
}

/** Sub-screen header: top row, breadcrumb eyebrow, title in the display font, muted subtitle, Back pill. */
export function Chrome({ c, theme, title, sub, onBack, focusBack }: { c: PropertyConfig; theme: Theme; title: string; sub?: string; onBack: () => void; focusBack?: boolean }) {
  return (
    <View style={styles.chrome}>
      <TopRow c={c} theme={theme} />
      <View style={styles.titleRow}>
        <View style={{ flex: 1, gap: 2 }}>
          <Eyebrow theme={theme}>Home  ›  {title}</Eyebrow>
          <Text style={[styles.title, { color: theme.ink, fontFamily: theme.fontBold }]}>{title}</Text>
          {sub ? <Text style={[styles.sub, { color: theme.sub, fontFamily: theme.font }]}>{sub}</Text> : null}
        </View>
        <Focusable theme={theme} onPress={onBack} hasTVPreferredFocus={focusBack} style={[styles.back, { borderColor: theme.panelLine, backgroundColor: theme.panel }]}>
          {(f) => <Text style={[styles.backText, { color: f ? theme.ink : theme.sub }]}>←  Back</Text>}
        </Focusable>
      </View>
    </View>
  )
}

export function Panel({ theme, style, children }: { theme: Theme; style?: StyleProp<ViewStyle>; children: React.ReactNode }) {
  return <View style={[styles.panel, { backgroundColor: theme.panel, borderColor: theme.panelLine, borderRadius: Math.max(14, theme.radius + 6) }, style]}>{children}</View>
}

export const Eyebrow = ({ children, theme, style }: { children: React.ReactNode; theme: Theme; style?: StyleProp<TextStyle> }) => (
  <Text style={[styles.eyebrow, { color: theme.faint, fontFamily: theme.font }, style]}>{children}</Text>
)

export const Chip = ({ children, theme }: { children: React.ReactNode; theme: Theme }) => (
  <View style={[styles.chip, { backgroundColor: theme.chip }]}>
    <Text style={[styles.chipT, { color: theme.ink, fontFamily: theme.font }]}>{children}</Text>
  </View>
)

/** Three dots that pulse in sequence while the concierge thinks. */
export function Dots({ theme }: { theme: Theme }) {
  const vals = useRef([0, 1, 2].map(() => new Animated.Value(0.25))).current
  useEffect(() => {
    const loops = vals.map((v, i) =>
      Animated.loop(Animated.sequence([
        Animated.delay(i * 160),
        Animated.timing(v, { toValue: 1, duration: 320, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0.25, duration: 320, useNativeDriver: true }),
        Animated.delay((2 - i) * 160),
      ])),
    )
    loops.forEach((l) => l.start())
    return () => loops.forEach((l) => l.stop())
  }, [])
  return (
    <View style={styles.dots}>
      {vals.map((v, i) => <Animated.View key={i} style={[styles.dot, { backgroundColor: theme.accent, opacity: v }]} />)}
    </View>
  )
}

export const PAD = 36

const styles = StyleSheet.create({
  screen: { flex: 1, width: '100%', height: '100%' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 24 },
  brand: { fontSize: 13, letterSpacing: 0.2 },
  logo: { height: 22, width: 180, alignSelf: 'flex-start' },
  clock: { fontSize: 13 },
  chrome: { gap: 16, marginBottom: 18 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 16 },
  title: { fontSize: 32, letterSpacing: -0.8, lineHeight: 36 },
  sub: { fontSize: 13.5, marginTop: 1 },
  back: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 7, marginBottom: 4 },
  backText: { fontSize: 12.5, fontWeight: '600' },
  panel: { borderWidth: 1, padding: 22 },
  eyebrow: { fontSize: 10.5, letterSpacing: 1.3, textTransform: 'uppercase' },
  chip: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  chipT: { fontSize: 11, fontWeight: '600' },
  dots: { flexDirection: 'row', gap: 6, alignItems: 'center', paddingVertical: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
})
