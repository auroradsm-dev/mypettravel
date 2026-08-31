import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { useNavigation } from '../navigation/NavigationContext'
import {
  useAppStore, selectTimeline, selectIsOnTrack,
  selectNextAction, selectAppConfig, selectUserNotes,
} from '../store/useAppStore'
import type { ScheduledTask, TaskStatus } from '../types/rules'
import { colors, radius, shadow, statusColors } from '../design/tokens'
import { PawPrint, PageBackground } from '../components/Illustrations'

function formatDate(date: Date | null): string {
  if (!date) return ''
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Progress stats ─────────────────────────────────────────────────────────────

type ProgressStats = {
  total: number; completed: number; inProgress: number
  overdue: number; notStarted: number
  pctCompleted: number; pctInProgress: number; pctOverdue: number; pctNotStarted: number
}

function computeStats(timeline: ScheduledTask[]): ProgressStats {
  const actionTasks = timeline.filter((t) => t.type === 'action' && t.required)
  const total = actionTasks.length
  if (total === 0) return { total: 0, completed: 0, inProgress: 0, overdue: 0, notStarted: 0, pctCompleted: 0, pctInProgress: 0, pctOverdue: 0, pctNotStarted: 0 }

  const completed = actionTasks.filter((t) => t.status === 'completed').length
  const inProgress = actionTasks.filter((t) => t.status === 'in_progress').length
  const overdue = actionTasks.filter((t) => t.status === 'overdue').length
  const notStarted = total - completed - inProgress - overdue

  return {
    total, completed, inProgress, overdue, notStarted,
    pctCompleted: Math.round((completed / total) * 100),
    pctInProgress: Math.round((inProgress / total) * 100),
    pctOverdue: Math.round((overdue / total) * 100),
    pctNotStarted: Math.round((notStarted / total) * 100),
  }
}

// ── Progress bar ───────────────────────────────────────────────────────────────

function ProgressBar({ stats }: { stats: ProgressStats }) {
  if (stats.total === 0) return null
  return (
    <View style={pb.container}>
      <View style={pb.bar}>
        {stats.pctCompleted > 0 && <View style={[pb.seg, { flex: stats.pctCompleted, backgroundColor: colors.statusGreen }]} />}
        {stats.pctInProgress > 0 && <View style={[pb.seg, { flex: stats.pctInProgress, backgroundColor: colors.statusPurple }]} />}
        {stats.pctOverdue > 0 && <View style={[pb.seg, { flex: stats.pctOverdue, backgroundColor: colors.statusRed }]} />}
        {stats.pctNotStarted > 0 && <View style={[pb.seg, { flex: stats.pctNotStarted, backgroundColor: colors.border }]} />}
      </View>
      <View style={pb.legend}>
        <LegendItem color={colors.statusGreen} label="Done" value={`${stats.pctCompleted}%`} />
        {stats.inProgress > 0 && <LegendItem color={colors.statusPurple} label="In progress" value={`${stats.inProgress}`} />}
        {stats.overdue > 0 && <LegendItem color={colors.statusRed} label="Overdue" value={`${stats.overdue}`} warn />}
        <LegendItem color={colors.border} label="Not started" value={`${stats.notStarted}`} />
        <Text style={pb.total}>{stats.completed}/{stats.total} steps</Text>
      </View>
    </View>
  )
}

function LegendItem({ color, label, value, warn }: { color: string; label: string; value: string; warn?: boolean }) {
  return (
    <View style={pb.legendItem}>
      <View style={[pb.dot, { backgroundColor: color }]} />
      <Text style={[pb.legendLabel, warn && { color: colors.statusRed }]}>{label}</Text>
      <Text style={[pb.legendValue, warn && { color: colors.statusRed, fontWeight: '700' }]}>{value}</Text>
    </View>
  )
}

const pb = StyleSheet.create({
  container: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: 18, marginBottom: 14,
    borderWidth: 1, borderColor: colors.border, ...shadow.card,
  },
  bar: {
    flexDirection: 'row', height: 8, borderRadius: 4,
    overflow: 'hidden', backgroundColor: colors.border, marginBottom: 16,
  },
  seg: { height: 8 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 12, color: colors.textSoft },
  legendValue: { fontSize: 12, fontWeight: '600', color: colors.text },
  total: { fontSize: 12, color: colors.textMuted, marginLeft: 'auto' },
})

// ── Task row ───────────────────────────────────────────────────────────────────

function TaskRow({ task, onPress, statusLabels, statusColorsMap, userNote }: {
  task: ScheduledTask
  onPress: () => void
  statusLabels: Record<string, string>
  statusColorsMap: Record<string, string>
  userNote?: string
}) {
  const isMilestone = task.type === 'milestone'
  const colorName = statusColorsMap[task.status]

  return (
    <TouchableOpacity
      style={[styles.taskRow, isMilestone && styles.milestoneRow]}
      onPress={onPress}
      disabled={isMilestone}
      activeOpacity={0.75}
    >
      {/* Left accent bar */}
      {!isMilestone && (
        <View style={[styles.accentBar, { backgroundColor: statusColors.fg(colorName) }]} />
      )}
      <View style={styles.taskLeft}>
        <Text style={[styles.taskTitle, isMilestone && styles.milestoneTitle]}>
          {task.title}
        </Text>
        {task.windowEnd && (
          <Text style={[styles.taskDate, task.status === 'overdue' && { color: colors.statusRed }]}>
            {task.status === 'overdue' ? 'Was due ' : 'By '}{formatDate(task.windowEnd)}
          </Text>
        )}
        {userNote ? (
          <Text style={styles.taskNote} numberOfLines={1}>📝 {userNote}</Text>
        ) : null}
      </View>
      <View style={[styles.badge, { backgroundColor: statusColors.bg(colorName) }]}>
        <Text style={[styles.badgeText, { color: statusColors.fg(colorName) }]}>
          {statusLabels[task.status] ?? task.status}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function TimelineScreen() {
  const { navigate } = useNavigation()
  const timeline = useAppStore(selectTimeline)
  const onTrack = useAppStore(selectIsOnTrack)
  const nextAction = useAppStore(selectNextAction)
  const appConfig = useAppStore(selectAppConfig)
  const onboarding = useAppStore((s) => s.onboarding)
  const userNotes = useAppStore(selectUserNotes)
  const { statusLabels, statusColors: statusColorsMap } = appConfig

  const stats = computeStats(timeline)

  return (
    <View style={styles.container}>
      <PageBackground variant="walk" size={380} opacity={0.28} style={{ top: 60, right: -60 }} />
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerEyebrow}>Your plan</Text>
            <Text style={styles.headerTitle}>
              {onboarding?.petName ? `${onboarding.petName}'s journey` : 'Timeline'}
            </Text>
            {onboarding?.travelDate && (
              <Text style={styles.headerSub}>
                Travel date: {formatDate(new Date(onboarding.travelDate))}
              </Text>
            )}
          </View>
          <PawPrint size={36} opacity={0.35} />
        </View>

        {/* Progress */}
        <ProgressBar stats={stats} />

        {/* Status banner */}
        <View style={[styles.trackBanner, { backgroundColor: onTrack ? colors.statusGreenBg : colors.statusRedBg }]}>
          <Text style={[styles.trackText, { color: onTrack ? colors.statusGreen : colors.statusRed }]}>
            {onTrack
              ? '✓  You\'re on track'
              : `⚠️  ${stats.overdue} overdue step${stats.overdue !== 1 ? 's' : ''} need attention`}
          </Text>
        </View>

        {/* Next action */}
        {nextAction && (
          <TouchableOpacity
            style={styles.nextAction}
            onPress={() => navigate({ name: 'task', taskId: nextAction.id })}
            activeOpacity={0.85}
          >
            <Text style={styles.nextLabel}>Up next</Text>
            <Text style={styles.nextTitle}>{nextAction.title}</Text>
            <Text style={styles.nextArrow}>→</Text>
          </TouchableOpacity>
        )}

        {/* Task list */}
        <View style={styles.list}>
          {timeline.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              statusLabels={statusLabels}
              statusColorsMap={statusColorsMap}
              userNote={userNotes[task.id]}
              onPress={() => navigate({ name: 'task', taskId: task.id })}
            />
          ))}
        </View>

      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, overflow: 'hidden' },
  scroll: { maxWidth: 900, width: '100%', alignSelf: 'center', padding: 24, paddingTop: 80, paddingBottom: 60 },

  header: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: 20,
  },
  headerEyebrow: { fontSize: 11, fontWeight: '700', color: colors.gold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: colors.textMuted, marginTop: 3 },

  trackBanner: {
    borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: 16,
  },
  trackText: { fontSize: 14, fontWeight: '600' },

  nextAction: {
    backgroundColor: colors.text,
    borderRadius: radius.lg, padding: 18,
    marginBottom: 22, flexDirection: 'row', alignItems: 'center',
    ...shadow.lifted,
  },
  nextLabel: {
    fontSize: 10, color: '#888', textTransform: 'uppercase',
    letterSpacing: 0.8, marginRight: 12,
  },
  nextTitle: { fontSize: 15, fontWeight: '700', color: colors.textInverse, flex: 1 },
  nextArrow: { fontSize: 16, color: '#666' },

  list: { gap: 8 },
  taskRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1, borderColor: colors.border,
    ...shadow.card,
  },
  accentBar: { width: 4, alignSelf: 'stretch' },
  milestoneRow: {
    backgroundColor: colors.surfaceAlt,
    borderStyle: 'dashed',
  },
  taskLeft: { flex: 1, paddingVertical: 14, paddingHorizontal: 14, marginRight: 8 },
  taskTitle: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 2, lineHeight: 20 },
  milestoneTitle: { color: colors.textSoft, fontWeight: '500', fontStyle: 'italic' },
  taskDate: { fontSize: 12, color: colors.textSoft },
  taskNote: { fontSize: 12, color: colors.statusPurple, marginTop: 3, fontStyle: 'italic' },
  badge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.sm,
    marginRight: 12, alignSelf: 'center',
  },
  badgeText: { fontSize: 11, fontWeight: '600' },
})
