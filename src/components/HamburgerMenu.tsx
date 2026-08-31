import { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native'
import { useNavigation } from '../navigation/NavigationContext'
import type { Screen } from '../navigation/NavigationContext'
import { colors, radius, shadow } from '../design/tokens'
import { PawPrint } from './Illustrations'
import { supabase } from '../lib/supabase'

type Props = { isOpen: boolean; onClose: () => void }

type NavItem = { label: string; icon: string; screen: Screen }

const NAV_ITEMS: NavItem[] = [
  { label: 'Home',       icon: '🏠', screen: { name: 'home' } },
  { label: 'Timeline',   icon: '📋', screen: { name: 'timeline' } },
  { label: 'Calendar',   icon: '📅', screen: { name: 'calendar' } },
  { label: 'To-do list', icon: '✅', screen: { name: 'todos' } },
  { label: 'Documents',  icon: '📂', screen: { name: 'documents' } },
  { label: 'Ask Claude', icon: '✦',  screen: { name: 'ask' } },
  { label: 'Profile',    icon: '🐾', screen: { name: 'profile' } },
]

const DRAWER_WIDTH = 268

export default function HamburgerMenu({ isOpen, onClose }: Props) {
  const { navigate, screen } = useNavigation()
  const slide = useRef(new Animated.Value(-DRAWER_WIDTH)).current

  useEffect(() => {
    Animated.spring(slide, {
      toValue: isOpen ? 0 : -DRAWER_WIDTH,
      useNativeDriver: true,
      bounciness: 0,
      speed: 20,
    }).start()
  }, [isOpen])

  function go(item: NavItem) { navigate(item.screen); onClose() }

  function handleSignOut() {
    onClose()
    supabase.auth.signOut()
  }

  return (
    <>
      {/* ── Backdrop ── */}
      {isOpen && (
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      )}

      {/* ── Drawer ── */}
      <Animated.View style={[styles.drawer, { transform: [{ translateX: slide }] }]}>
        {/* Logo area */}
        <View style={styles.drawerTop}>
          <View style={styles.logoRow}>
            <PawPrint size={22} opacity={0.8} />
            <Text style={styles.logoText}>My Pet Travel</Text>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.closeX}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Nav items */}
        <View style={styles.navList}>
          {NAV_ITEMS.map((item) => {
            const isActive = screen.name === item.screen.name
            return (
              <TouchableOpacity
                key={item.label}
                style={[styles.navItem, isActive && styles.navItemActive]}
                onPress={() => go(item)}
                activeOpacity={0.75}
              >
                <Text style={styles.navIcon}>{item.icon}</Text>
                <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                  {item.label}
                </Text>
                {isActive && <View style={styles.activePip} />}
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutRow} onPress={handleSignOut} activeOpacity={0.75}>
          <Text style={styles.signOutIcon}>↩</Text>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>

        <View style={styles.drawerFooter}>
          <Text style={styles.footerText}>Pet travel, simplified.</Text>
        </View>
      </Animated.View>
    </>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(44,40,37,0.35)', zIndex: 300,
  },

  drawer: {
    position: 'absolute', top: 0, left: 0, bottom: 0,
    width: DRAWER_WIDTH, backgroundColor: colors.surface,
    zIndex: 400, paddingTop: 52,
    borderRightWidth: 1, borderRightColor: colors.border,
    ...shadow.lifted,
  },

  drawerTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 20,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoText: { fontSize: 18, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  closeX: { fontSize: 16, color: colors.textSoft },

  navList: { paddingTop: 12, paddingHorizontal: 10 },
  navItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 12,
    borderRadius: radius.md, marginBottom: 2,
    position: 'relative',
  },
  navItemActive: { backgroundColor: colors.goldLight },
  navIcon: { fontSize: 17, marginRight: 12, width: 22, textAlign: 'center' },
  navLabel: { fontSize: 15, color: colors.textSoft, fontWeight: '500', flex: 1 },
  navLabelActive: { color: colors.goldDark, fontWeight: '700' },
  activePip: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: colors.gold,
  },

  signOutRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 10, marginTop: 8,
    paddingVertical: 12, paddingHorizontal: 12,
    borderRadius: radius.md,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  signOutIcon: { fontSize: 17, width: 22, textAlign: 'center', color: colors.textMuted },
  signOutText: { fontSize: 15, color: colors.textMuted, fontWeight: '500' },

  drawerFooter: { position: 'absolute', bottom: 28, left: 20 },
  footerText: { fontSize: 11, color: colors.textMuted, letterSpacing: 0.3 },
})
