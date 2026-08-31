import { useEffect, useRef, useState, Component, ReactNode } from 'react'
import { View, StyleSheet, Text, ActivityIndicator, TouchableOpacity } from 'react-native'
import { NavigationProvider, useNavigation } from './src/navigation/NavigationContext'
import { useAppStore, extractSyncData } from './src/store/useAppStore'
import { loadUserData, saveUserData } from './src/lib/userDataSync'
import { fetchRemoteUpdates } from './src/engine/configLoader'
import { supabase } from './src/lib/supabase'
import type { User } from '@supabase/supabase-js'
import WelcomeScreen from './src/screens/WelcomeScreen'
import SetupScreen from './src/screens/SetupScreen'
import HomeScreen from './src/screens/HomeScreen'
import TimelineScreen from './src/screens/TimelineScreen'
import TaskScreen from './src/screens/TaskScreen'
import CalendarScreen from './src/screens/CalendarScreen'
import ProfileScreen from './src/screens/ProfileScreen'
import TodosScreen from './src/screens/TodosScreen'
import AskClaudeScreen from './src/screens/AskClaudeScreen'
import DocumentsScreen from './src/screens/DocumentsScreen'
import AuthScreen from './src/screens/AuthScreen'
import HamburgerMenu from './src/components/HamburgerMenu'
import FloatingAskClaude from './src/components/FloatingAskClaude'
import type { Screen } from './src/navigation/NavigationContext'
import { colors } from './src/design/tokens'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
      const err = this.state.error as Error
      return (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMsg}>{err.message}</Text>
          <Text style={styles.errorStack}>{err.stack}</Text>
        </View>
      )
    }
    return this.props.children
  }
}

function AppContent({ user }: { user: User }) {
  const { screen, replace, goBack, history } = useNavigation()
  const [menuOpen, setMenuOpen] = useState(false)
  const isOnboarded = useAppStore((s) => s.isOnboarded)
  const appConfig = useAppStore((s) => s.appConfig)
  const updateRuleset = useAppStore((s) => s.updateRuleset)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    const { manifestUrl, fetchTimeoutMs } = appConfig.remoteConfig
    fetchRemoteUpdates(manifestUrl, fetchTimeoutMs, updateRuleset)
    // Synchronously store email so ProfileScreen can read it without async
    useAppStore.getState().setUserEmail(user.email ?? null)
  }, [])

  // Auto-save to Supabase whenever store state changes (debounced 3s)
  useEffect(() => {
    const unsub = useAppStore.subscribe((state) => {
      clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        saveUserData(user.id, extractSyncData(state), user.email)
      }, 3000)
    })
    // Also save immediately on mount so first-time onboarding is persisted
    saveUserData(user.id, extractSyncData(useAppStore.getState()), user.email)
    return () => { unsub(); clearTimeout(saveTimer.current) }
  }, [user.id])

  const effectiveScreen: Screen = (() => {
    if (isOnboarded && (screen.name === 'welcome' || screen.name === 'setup')) {
      return { name: 'home' }
    }
    if (!isOnboarded && screen.name !== 'welcome' && screen.name !== 'setup') {
      return { name: 'welcome' }
    }
    return screen
  })()

  const showMenu = isOnboarded &&
    effectiveScreen.name !== 'welcome' &&
    effectiveScreen.name !== 'setup'

  const appHistory = history.filter((s) => s.name !== 'welcome' && s.name !== 'setup')
  const canGoBack = appHistory.length > 1
  const isHome = effectiveScreen.name === 'home'

  return (
    <View style={styles.root}>
      {/* ── Nav bar — real height so screens start below it, no overlap ── */}
      {showMenu && (
        <View style={styles.navBar}>
          <View style={styles.navLeft}>
            <TouchableOpacity
              style={styles.navHamburger}
              onPress={() => setMenuOpen((o) => !o)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View style={styles.navBarLine} />
              <View style={[styles.navBarLine, { width: 14 }]} />
              <View style={styles.navBarLine} />
            </TouchableOpacity>

            {!isHome && (
              <TouchableOpacity
                style={styles.navHomeBtn}
                onPress={() => { replace({ name: 'home' }); setMenuOpen(false) }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.navHomeTxt}>🐾 Home</Text>
              </TouchableOpacity>
            )}
          </View>

          {canGoBack && (
            <TouchableOpacity
              style={styles.navBackBtn}
              onPress={goBack}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.navBackTxt}>←</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {effectiveScreen.name === 'welcome'  && <WelcomeScreen />}
      {effectiveScreen.name === 'setup'    && <SetupScreen />}
      {effectiveScreen.name === 'home'     && <HomeScreen />}
      {effectiveScreen.name === 'timeline' && <TimelineScreen />}
      {effectiveScreen.name === 'task'     && <TaskScreen taskId={effectiveScreen.taskId} />}
      {effectiveScreen.name === 'calendar' && <CalendarScreen />}
      {effectiveScreen.name === 'profile'  && <ProfileScreen />}
      {effectiveScreen.name === 'todos'    && <TodosScreen />}
      {effectiveScreen.name === 'ask'       && <AskClaudeScreen />}
      {effectiveScreen.name === 'documents' && <DocumentsScreen />}

      {showMenu && (
        <HamburgerMenu
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
        />
      )}
      {showMenu && effectiveScreen.name !== 'ask' && (
        <FloatingAskClaude />
      )}
    </View>
  )
}

// Wipe local data whenever the active user changes (or when there was any previous user)
function handleUserSwitch(newUserId: string): void {
  try {
    const storedId = localStorage.getItem('mpt_userId')
    // Clear if there was ANY previously stored user that differs — no gap on shared devices
    if (storedId !== newUserId) {
      useAppStore.getState().clearAllUserData()
    }
    localStorage.setItem('mpt_userId', newUserId)
  } catch {}
}

// Wipe everything on sign-out so the next person who opens the browser sees nothing
function handleSignOut(): void {
  try {
    localStorage.removeItem('mpt_userId')
  } catch {}
  useAppStore.getState().clearAllUserData()
}

function AuthGate() {
  const [user, setUser] = useState<User | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // initSession handles the initial page load. onAuthStateChange handles
    // subsequent logins/logouts within the same browser session.
    // We use a flag to prevent double-hydration since Supabase fires
    // INITIAL_SESSION through onAuthStateChange at the same time as getSession().
    let initDone = false

    async function initSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          handleUserSwitch(session.user.id)
          const remote = await loadUserData(session.user.id)
          if (remote) useAppStore.getState().hydrateFromRemote(remote)
          useAppStore.getState().setUserEmail(session.user.email ?? null)
        }
        setUser(session?.user ?? null)
      } catch (e) {
        console.error('initSession error:', e)
      } finally {
        initDone = true
        setChecking(false)  // always unblock the spinner
      }
    }
    initSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // Skip INITIAL_SESSION — initSession already handles the page-load case,
      // preventing a race condition where two hydrateFromRemote calls run concurrently.
      if (_event === 'INITIAL_SESSION') return

      try {
        if (!session?.user) {
          // User signed out — immediately wipe all local data
          handleSignOut()
          setUser(null)
          return
        }

        // User signed in (possibly switching accounts)
        handleUserSwitch(session.user.id)
        const remote = await loadUserData(session.user.id)
        if (remote) useAppStore.getState().hydrateFromRemote(remote)
        useAppStore.getState().setUserEmail(session.user.email ?? null)
        setUser(session.user)
      } catch (e) {
        console.error('onAuthStateChange error:', e)
      } finally {
        // Unblock spinner if initSession somehow never resolved
        if (!initDone) { initDone = true; setChecking(false) }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (checking) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    )
  }

  if (!user) return <AuthScreen />

  return (
    <NavigationProvider>
      <ErrorBoundary>
        <AppContent user={user} />
      </ErrorBoundary>
    </NavigationProvider>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthGate />
    </ErrorBoundary>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  splash: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },

  // ── Nav bar (real layout space, never overlaps content) ──────────────────
  navBar: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: colors.bg,
    zIndex: 100,
  },
  navLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navHamburger: {
    padding: 10, backgroundColor: colors.surface,
    borderRadius: 10, gap: 4, alignItems: 'flex-start',
    borderWidth: 1, borderColor: colors.border,
  },
  navBarLine: { width: 18, height: 2, backgroundColor: colors.text, borderRadius: 2 },
  navHomeBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: colors.surface, borderRadius: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  navHomeTxt: { fontSize: 13, fontWeight: '600', color: colors.textSoft },
  navBackBtn: {
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: colors.surface, borderRadius: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  navBackTxt: { fontSize: 18, color: colors.text, lineHeight: 20 },
  errorBox: { flex: 1, padding: 32, paddingTop: 80, backgroundColor: colors.surface },
  errorTitle: { fontSize: 18, fontWeight: '700', color: colors.statusRed, marginBottom: 10 },
  errorMsg: { fontSize: 14, color: colors.text, marginBottom: 10, lineHeight: 22 },
  errorStack: { fontSize: 11, color: colors.textSoft, fontFamily: 'monospace', lineHeight: 18 },
})
