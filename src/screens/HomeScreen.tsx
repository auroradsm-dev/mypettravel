import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native'
import { useNavigation } from '../navigation/NavigationContext'
import {
  useAppStore, selectTimeline, selectNextAction,
  selectIsOnTrack, selectProgressDone, selectProgressTotal, selectAppConfig,
  selectPetPhoto, selectAppointmentDates, selectCalendarEntries,
} from '../store/useAppStore'
import CalendarView from '../components/CalendarView'
import { PawPrint, PageBackground } from '../components/Illustrations'
import { colors, radius, shadow } from '../design/tokens'

function daysUntil(isoDate: string): number {
  const travel = new Date(isoDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  travel.setHours(0, 0, 0, 0)
  return Math.ceil((travel.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function formatTravelDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function ProgressLine({ done, total }: { done: number; total: number }) {
  if (total === 0) return null
  const pct = Math.round((done / total) * 100)
  return (
    <View style={prog.row}>
      <View style={prog.track}>
        <View style={[prog.fill, { flex: pct || 0.01, backgroundColor: 'rgba(255,255,255,0.9)' }]} />
        <View style={[prog.fill, { flex: 100 - pct, backgroundColor: 'rgba(255,255,255,0.2)' }]} />
      </View>
      <Text style={prog.label}>{done}/{total} done</Text>
    </View>
  )
}
const prog = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  track: { flex: 1, flexDirection: 'row', height: 4, borderRadius: 2, overflow: 'hidden' },
  fill: { height: 4 },
  label: { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
})

export default function HomeScreen() {
  const { navigate } = useNavigation()
  const onboarding = useAppStore((s) => s.onboarding)
  const timeline = useAppStore(selectTimeline)
  const nextAction = useAppStore(selectNextAction)
  const onTrack = useAppStore(selectIsOnTrack)
  const done = useAppStore(selectProgressDone)
  const total = useAppStore(selectProgressTotal)
  const appConfig = useAppStore(selectAppConfig)
  const petPhoto = useAppStore(selectPetPhoto)
  const appointmentDates = useAppStore(selectAppointmentDates)
  const calendarEntries = useAppStore(selectCalendarEntries)

  if (!onboarding) return null

  const days = daysUntil(onboarding.travelDate)
  const overdue = timeline.filter((t) => t.status === 'overdue')
  const destLabel = onboarding.destinationCountry
    ? appConfig.supportedRoutes.euCountries.find((c) => c.code === onboarding.destinationCountry)?.name ?? onboarding.destination
    : onboarding.destination

  const daysPast = days < 0
  const daysUrgent = !daysPast && days <= 14

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>

      {/* ── HERO ──────────────────────────────────────────────────────────────── */}
      <View style={styles.hero}>
        {/* Background dog illustration — abstract, inside hero */}
        <PageBackground
          variant="seated"
          size={300}
          opacity={0.12}
          style={{ bottom: -30, right: -50 }}
        />

        {/* Header row: brand + pet avatar */}
        <View style={styles.heroHeader}>
          <View style={styles.heroBrand}>
            <PawPrint size={14} opacity={0.9} />
            <Text style={styles.heroBrandText}>MY PET TRAVEL</Text>
          </View>

          {/* Pet photo avatar */}
          <TouchableOpacity
            style={styles.petAvatar}
            onPress={() => navigate({ name: 'profile' })}
            activeOpacity={0.85}
          >
            {petPhoto ? (
              <Image source={{ uri: petPhoto }} style={styles.petAvatarImg} />
            ) : (
              <View style={styles.petAvatarPlaceholder}>
                <PawPrint size={26} opacity={0.5} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Punchy headline */}
        <Text style={styles.heroHeadline}>Every step.{'\n'}On time.</Text>
        <Text style={styles.heroSub}>
          Your complete relocation plan for{' '}
          <Text style={styles.heroSubBold}>{onboarding.petName}</Text>
          {' '}— {onboarding.origin} to {destLabel}.
        </Text>

        {/* Progress bar */}
        <ProgressLine done={done} total={total} />

        {/* Stats row */}
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatNum}>{total}</Text>
            <Text style={styles.heroStatLabel}>steps</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatNum}>{done}</Text>
            <Text style={styles.heroStatLabel}>done</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={[styles.heroStatNum, overdue.length > 0 && styles.heroStatNumWarn]}>
              {Math.abs(days)}
            </Text>
            <Text style={styles.heroStatLabel}>
              {daysPast ? 'days ago' : 'days left'}
            </Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={[styles.heroStatus, onTrack ? styles.heroStatusOk : styles.heroStatusWarn]}>
            <Text style={styles.heroStatusText}>
              {onTrack ? '✓  On track' : `⚠  ${overdue.length} overdue`}
            </Text>
          </View>
        </View>

        {/* Travel date */}
        <Text style={styles.heroDate}>✈  {formatTravelDate(onboarding.travelDate)}</Text>
      </View>

      {/* ── STATUS BANNER ─────────────────────────────────────────────────────── */}
      {overdue.length > 0 && (
        <TouchableOpacity
          style={styles.warnBanner}
          onPress={() => navigate({ name: 'timeline' })}
          activeOpacity={0.85}
        >
          <Text style={styles.warnBannerText}>
            ⚠️  {overdue.length} overdue step{overdue.length !== 1 ? 's' : ''} — tap to review your timeline
          </Text>
        </TouchableOpacity>
      )}

      {/* ── NEXT ACTION ───────────────────────────────────────────────────────── */}
      {nextAction && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Up next</Text>
          <TouchableOpacity
            style={styles.nextCard}
            onPress={() => navigate({ name: 'task', taskId: nextAction.id })}
            activeOpacity={0.85}
          >
            <View style={styles.nextLeft}>
              <Text style={styles.nextCat}>{appConfig.categoryLabels[nextAction.category]}</Text>
              <Text style={styles.nextTitle}>{nextAction.title}</Text>
              {nextAction.windowEnd && (
                <Text style={styles.nextDue}>
                  Due {nextAction.windowEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </Text>
              )}
            </View>
            <Text style={styles.nextArrow}>→</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── QUICK NAV ─────────────────────────────────────────────────────────── */}
      <View style={styles.quickRow}>
        {[
          { icon: '📋', label: 'Timeline',  screen: 'timeline'  as const },
          { icon: '📅', label: 'Calendar',  screen: 'calendar'  as const },
          { icon: '📂', label: 'Documents', screen: 'documents' as const },
          { icon: '✅', label: 'To-do',     screen: 'todos'     as const },
        ].map(({ icon, label, screen }) => (
          <TouchableOpacity key={screen} style={styles.quickBtn} onPress={() => navigate({ name: screen })}>
            <Text style={styles.quickIcon}>{icon}</Text>
            <Text style={styles.quickLabel}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── CALENDAR ──────────────────────────────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>Calendar</Text>
          <TouchableOpacity onPress={() => navigate({ name: 'calendar' })}>
            <Text style={styles.sectionLink}>Full view →</Text>
          </TouchableOpacity>
        </View>
        <CalendarView
          timeline={timeline}
          appointmentDates={appointmentDates}
          calendarEntries={calendarEntries}
          compact
        />
      </View>

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { maxWidth: 900, width: '100%', alignSelf: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 60 },

  // ── Hero ──
  hero: {
    backgroundColor: colors.text,
    borderRadius: radius.xl,
    padding: 24,
    marginBottom: 14,
    overflow: 'hidden',
    ...shadow.lifted,
  },
  heroHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 20,
  },
  heroBrand: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  heroBrandText: {
    fontSize: 10, fontWeight: '800', color: colors.gold,
    letterSpacing: 2.5,
  },

  // Pet photo avatar
  petAvatar: {
    width: 96, height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    borderWidth: 2.5, borderColor: 'rgba(201,169,110,0.6)',
  },
  petAvatarImg: { width: '100%', height: '100%' },
  petAvatarPlaceholder: {
    width: '100%', height: '100%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroHeadline: {
    fontSize: 28, fontWeight: '900', color: '#FFFDF9',
    lineHeight: 34, letterSpacing: -0.5, marginBottom: 10,
  },
  heroSub: {
    fontSize: 15, color: 'rgba(255,253,249,0.65)', lineHeight: 23,
  },
  heroSubBold: { color: '#FFFDF9', fontWeight: '700' },

  heroStats: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 18, gap: 0,
  },
  heroStat: { alignItems: 'center', paddingHorizontal: 14 },
  heroStatNum: { fontSize: 22, fontWeight: '800', color: '#FFFDF9' },
  heroStatNumWarn: { color: '#FFAA99' },
  heroStatLabel: { fontSize: 10, color: 'rgba(255,253,249,0.5)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 1 },
  heroStatDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,253,249,0.1)' },
  heroStatus: {
    marginLeft: 'auto',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: radius.full,
  },
  heroStatusOk: { backgroundColor: 'rgba(143,175,138,0.25)' },
  heroStatusWarn: { backgroundColor: 'rgba(194,94,94,0.25)' },
  heroStatusText: { fontSize: 12, fontWeight: '700', color: '#FFFDF9' },
  heroDate: {
    fontSize: 13, color: 'rgba(255,253,249,0.45)',
    marginTop: 14,
  },

  // ── Warn banner ──
  warnBanner: {
    backgroundColor: colors.statusRedBg, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 11, marginBottom: 20,
  },
  warnBannerText: { fontSize: 14, fontWeight: '600', color: colors.statusRed },

  // ── Sections ──
  section: { marginBottom: 26 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 12 },
  sectionLink: { fontSize: 13, color: colors.textSoft },

  // ── Next action ──
  nextCard: {
    backgroundColor: colors.gold, borderRadius: radius.lg,
    padding: 20, flexDirection: 'row', alignItems: 'center', ...shadow.lifted,
  },
  nextLeft: { flex: 1 },
  nextCat: { fontSize: 10, color: 'rgba(44,40,37,0.6)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
  nextTitle: { fontSize: 16, fontWeight: '800', color: colors.text, lineHeight: 22 },
  nextDue: { fontSize: 12, color: 'rgba(44,40,37,0.6)', marginTop: 5 },
  nextArrow: { fontSize: 20, color: 'rgba(44,40,37,0.5)', marginLeft: 12 },

  // ── Quick nav ──
  quickRow: { flexDirection: 'row', gap: 8, marginBottom: 26 },
  quickBtn: {
    flex: 1, backgroundColor: colors.surface,
    borderRadius: radius.lg, paddingVertical: 16,
    alignItems: 'center', gap: 5,
    borderWidth: 1, borderColor: colors.border, ...shadow.card,
  },
  quickIcon: { fontSize: 20 },
  quickLabel: { fontSize: 11, fontWeight: '600', color: colors.textSoft },
})
