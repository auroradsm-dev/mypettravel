import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useNavigation } from '../navigation/NavigationContext'
import { DogIllustration, PageBackground, PawPrint } from '../components/Illustrations'
import { colors, radius, shadow } from '../design/tokens'
import { supabase } from '../lib/supabase'

const FEATURES = [
  {
    icon: '📋',
    title: 'Step-by-step timeline',
    body: 'Every required step, in the right order, with deadlines calculated from your travel date. No guessing.',
  },
  {
    icon: '📂',
    title: 'Document vault',
    body: 'Upload health certs, permits, airline invoices and vaccination records — everything in one place.',
  },
  {
    icon: '✦',
    title: 'AI assistant',
    body: 'Ask Claude anything about vets, AVIH bookings, EU entry rules, or what to pack for a long-haul flight.',
  },
  {
    icon: '✅',
    title: 'Personal checklist',
    body: 'A separate to-do list for things to buy, book, and organise that aren\'t part of the official process.',
  },
]

export default function WelcomeScreen() {
  const { navigate } = useNavigation()

  return (
    <View style={styles.root}>
      {/* Sign out — always accessible */}
      <TouchableOpacity style={styles.signOutBtn} onPress={() => supabase.auth.signOut()}>
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>

    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <View style={styles.hero}>
        <PageBackground variant="seated" size={420} opacity={0.11} style={{ bottom: -40, right: -60 }} />

        {/* Brand */}
        <View style={styles.heroBrand}>
          <PawPrint size={13} opacity={0.85} />
          <Text style={styles.heroBrandText}>MY PET TRAVEL</Text>
        </View>

        {/* Headline */}
        <Text style={styles.heroHeadline}>
          Relocate your pet{'\n'}by yourself — stress‑free.
        </Text>
        <Text style={styles.heroSub}>
          A free, personalised plan for South African pet owners moving to the EU. Every step, every document, every deadline — in one place.
        </Text>

        {/* Pills */}
        <View style={styles.heroPills}>
          {['No account needed', 'SA → EU specialist', '100% free'].map((p) => (
            <View key={p} style={styles.heroPill}>
              <Text style={styles.heroPillText}>✓  {p}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={styles.heroBtn}
          onPress={() => navigate({ name: 'setup' })}
          activeOpacity={0.85}
        >
          <Text style={styles.heroBtnText}>Build my free plan  →</Text>
        </TouchableOpacity>
      </View>

      {/* ── WHAT IT DOES ─────────────────────────────────────────────────────── */}
      <Text style={styles.sectionHead}>Everything you need</Text>
      <View style={styles.featureGrid}>
        {FEATURES.map((f) => (
          <View key={f.title} style={styles.featureCard}>
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <Text style={styles.featureTitle}>{f.title}</Text>
            <Text style={styles.featureBody}>{f.body}</Text>
          </View>
        ))}
      </View>

      {/* ── CALLOUT ──────────────────────────────────────────────────────────── */}
      <View style={styles.callout}>
        <View style={styles.calloutLeft}>
          <DogIllustration size={160} />
        </View>
        <View style={styles.calloutRight}>
          <Text style={styles.calloutTitle}>Built for DIY relocation</Text>
          <Text style={styles.calloutBody}>
            Skip the expensive relocation agents. My Pet Travel gives you the same structured process — vet appointments, state vet checks, microchip verification, airline AVIH, EU entry — all timed to your travel date.
          </Text>
        </View>
      </View>

      {/* ── BOTTOM CTA ───────────────────────────────────────────────────────── */}
      <View style={styles.bottomCta}>
        <Text style={styles.bottomCtaTitle}>Ready to start?</Text>
        <Text style={styles.bottomCtaSub}>Takes 2 minutes to set up. Free forever.</Text>
        <TouchableOpacity
          style={styles.heroBtn}
          onPress={() => navigate({ name: 'setup' })}
          activeOpacity={0.85}
        >
          <Text style={styles.heroBtnText}>Get started  →</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  signOutBtn: {
    position: 'absolute', top: 20, right: 20, zIndex: 100,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  signOutText: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  container: { flex: 1 },
  scroll: { maxWidth: 900, width: '100%', alignSelf: 'center', paddingBottom: 60 },

  // ── Hero ──
  hero: {
    backgroundColor: colors.text,
    margin: 16,
    marginTop: 32,
    borderRadius: radius.xl,
    padding: 36,
    overflow: 'hidden',
    ...shadow.lifted,
  },
  heroBrand: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 28 },
  heroBrandText: { fontSize: 10, fontWeight: '800', color: colors.gold, letterSpacing: 2.5 },

  heroHeadline: {
    fontSize: 34, fontWeight: '900', color: '#FFFDF9',
    lineHeight: 40, letterSpacing: -0.8, marginBottom: 16,
  },
  heroSub: {
    fontSize: 16, color: 'rgba(255,253,249,0.70)', lineHeight: 25, marginBottom: 24,
    maxWidth: 540,
  },

  heroPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 28 },
  heroPill: {
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.full,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  heroPillText: { fontSize: 12, color: 'rgba(255,253,249,0.75)', fontWeight: '600' },

  heroBtn: {
    backgroundColor: colors.gold,
    paddingVertical: 16, paddingHorizontal: 28,
    borderRadius: radius.lg,
    alignSelf: 'flex-start',
    ...shadow.card,
  },
  heroBtnText: { color: colors.text, fontSize: 15, fontWeight: '800', letterSpacing: 0.1 },

  // ── Feature grid ──
  sectionHead: {
    fontSize: 20, fontWeight: '800', color: colors.text,
    letterSpacing: -0.3, marginTop: 40, marginBottom: 16,
    paddingHorizontal: 16,
  },
  featureGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16,
  },
  featureCard: {
    flex: 1, minWidth: 200,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 20,
    borderWidth: 1, borderColor: colors.border,
    ...shadow.card,
  },
  featureIcon: { fontSize: 26, marginBottom: 10 },
  featureTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 6 },
  featureBody: { fontSize: 13, color: colors.textSoft, lineHeight: 20 },

  // ── Callout ──
  callout: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.goldLight,
    borderRadius: radius.xl,
    margin: 16, marginTop: 32,
    padding: 28, gap: 24,
    overflow: 'hidden',
    borderWidth: 1, borderColor: colors.goldMid,
  },
  calloutLeft: { flexShrink: 0 },
  calloutRight: { flex: 1 },
  calloutTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 10, letterSpacing: -0.2 },
  calloutBody: { fontSize: 14, color: colors.textSoft, lineHeight: 22 },

  // ── Bottom CTA ──
  bottomCta: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 16 },
  bottomCtaTitle: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 6, letterSpacing: -0.3 },
  bottomCtaSub: { fontSize: 14, color: colors.textMuted, marginBottom: 24 },
})
