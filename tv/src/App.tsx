import React, { useEffect, useRef, useState } from 'react'
import { BackHandler, StyleSheet, Text, View } from 'react-native'
import { getState, HttpError, loadCachedState, loadSecret, register, saveCachedState, saveSecret } from './api'
import { Ask } from './screens/Ask'
import { Checkout } from './screens/Checkout'
import { Contacts } from './screens/Contacts'
import { Guide } from './screens/Guide'
import { Home } from './screens/Home'
import { Pair } from './screens/Pair'
import { Places } from './screens/Places'
import { Rules } from './screens/Rules'
import { Wifi } from './screens/Wifi'
import type { TileKey, TvState } from './types'
import { Screen, themeFor } from './ui'

const PAIR_POLL_MS = 5_000
const CONFIG_POLL_MS = 60_000

export const App = () => {
  const [secret, setSecret] = useState<string | null>(null)
  const [state, setState] = useState<TvState | null>(null)
  const [notice, setNotice] = useState('')
  const [stack, setStack] = useState<TileKey[]>([])
  const stackRef = useRef(stack)
  stackRef.current = stack

  // Boot: show the last saved screen immediately, then find or create this TV's identity.
  useEffect(() => {
    ;(async () => {
      const cached = await loadCachedState()
      if (cached) setState(cached)
      let s = await loadSecret()
      if (!s) {
        try {
          const r = await register()
          s = r.secret
          await saveSecret(s)
        } catch {
          setNotice('Cannot reach Stayboard. Check the TV is online.')
          return
        }
      }
      setSecret(s)
    })()
  }, [])

  // Poll: fast while waiting to be paired, once a minute after.
  const paired = state?.paired === true
  useEffect(() => {
    if (!secret) return
    let alive = true
    const tick = async () => {
      try {
        const s = await getState(secret)
        if (!alive) return
        setState(s)
        setNotice('')
        if (s.paired) saveCachedState(s)
        else setStack([])
      } catch (e) {
        if (!alive) return
        if (e instanceof HttpError && e.status === 401) {
          const r = await register().catch(() => null)
          if (r) {
            await saveSecret(r.secret)
            setSecret(r.secret)
          }
        } else setNotice('Offline. Showing the last saved screen.')
      }
    }
    tick()
    const id = setInterval(tick, paired ? CONFIG_POLL_MS : PAIR_POLL_MS)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [secret, paired])

  // Remote Back key pops the screen stack; on Home it falls through to the system.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stackRef.current.length) {
        setStack((s) => s.slice(0, -1))
        return true
      }
      return false
    })
    return () => sub.remove()
  }, [])

  const back = () => setStack((s) => s.slice(0, -1))
  const open = (k: TileKey) => setStack((s) => [...s, k])

  if (!state) {
    const theme = themeFor(null)
    return (
      <Screen theme={theme}>
        <View style={styles.center}>
          <Text style={[styles.brand, { color: theme.ink }]}>Stayboard</Text>
          <Text style={[styles.status, { color: theme.sub }]}>{notice || 'Starting up…'}</Text>
        </View>
      </Screen>
    )
  }

  if (!state.paired) return <Pair code={state.code} pairUrl={state.pairUrl} notice={notice} />

  const theme = themeFor(state.config)
  const c = state.config
  const top = stack[stack.length - 1]
  const props = { c, theme, onBack: back }
  return (
    <Screen theme={theme} photo={c.appearance.backgroundUrl || undefined}>
      {top === undefined && <Home c={c} theme={theme} onOpen={open} notice={notice} />}
      {top === 'wifi' && <Wifi {...props} />}
      {top === 'checkout' && <Checkout {...props} />}
      {top === 'rules' && <Rules {...props} />}
      {top === 'guide' && <Guide {...props} />}
      {top === 'places' && <Places {...props} />}
      {top === 'contacts' && <Contacts {...props} />}
      {top === 'ask' && secret && <Ask {...props} secret={secret} guestUrl={state.guestUrl} />}
    </Screen>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  brand: { fontSize: 36, fontWeight: '600', letterSpacing: -1 },
  status: { fontSize: 14 },
})
