import { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native'
import type { ScheduledTask } from '../types/rules'
import type { CalendarEntry } from '../store/useAppStore'
import { colors, radius, shadow } from '../design/tokens'

function dotColor(status: string): string {
  const map: Record<string, string> = {
    completed: colors.statusGreen,
    in_progress: colors.statusPurple,
    overdue: colors.statusRed,
    due_soon: colors.statusOrange,
    in_window: colors.statusBlue,
    upcoming: colors.border,
    blocked: colors.border,
    milestone_reached: colors.statusGreen,
    milestone_pending: colors.border,
  }
  return map[status] ?? colors.border
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    completed: 'Completed', in_progress: 'In progress', overdue: 'Overdue',
    due_soon: 'Due soon', in_window: 'Ready', upcoming: 'Upcoming',
    blocked: 'Blocked', milestone_reached: 'Reached', milestone_pending: 'Pending',
  }
  return map[status] ?? status
}

const APPT_COLOR = colors.gold
const ENTRY_COLOR = colors.sage

type DotEntry = { color: string; taskId?: string; entryId?: string; kind: 'task' | 'appointment' | 'manual' }
type DotMap = Record<string, DotEntry[]>

function buildDotMap(
  timeline: ScheduledTask[],
  appointmentDates: Record<string, string>,
  calendarEntries: CalendarEntry[],
): DotMap {
  const map: DotMap = {}

  function add(key: string, entry: DotEntry) {
    if (!map[key]) map[key] = []
    const dup = map[key].find(
      (e) => (entry.taskId && e.taskId === entry.taskId) || (entry.entryId && e.entryId === entry.entryId)
    )
    if (!dup) map[key].push(entry)
  }

  for (const task of timeline) {
    if (task.completedAt) add(dateKey(task.completedAt), { color: colors.statusGreen, taskId: task.id, kind: 'task' })
    else if (task.windowEnd) add(dateKey(task.windowEnd), { color: dotColor(task.status), taskId: task.id, kind: 'task' })
  }
  for (const [taskId, isoDate] of Object.entries(appointmentDates)) {
    const d = new Date(isoDate + 'T12:00:00')
    if (!isNaN(d.getTime())) add(dateKey(d), { color: APPT_COLOR, taskId, kind: 'appointment' })
  }
  for (const entry of calendarEntries) {
    const d = new Date(entry.date + 'T12:00:00')
    if (!isNaN(d.getTime())) add(dateKey(d), { color: ENTRY_COLOR, entryId: entry.id, kind: 'manual' })
  }
  return map
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function formatShort(d: Date) {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatLong(d: Date) {
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

type ModalItem =
  | { kind: 'task'; task: ScheduledTask }
  | { kind: 'appointment'; taskId: string; taskTitle: string; isoDate: string }
  | { kind: 'manual'; entry: CalendarEntry }

function DayModal({
  date, items, onClose, onDeleteEntry, onAddNote,
}: {
  date: Date
  items: ModalItem[]
  onClose: () => void
  onDeleteEntry?: (id: string) => void
  onAddNote?: (date: Date) => void
}) {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View style={mod.overlay} pointerEvents="box-none">
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={mod.sheet}>
          <View style={mod.header}>
            <View>
              <Text style={mod.dateLabel}>{formatShort(date)}</Text>
              <Text style={mod.dateCount}>
                {items.length > 0 ? `${items.length} item${items.length !== 1 ? 's' : ''}` : 'Nothing scheduled'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={mod.closeX}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {items.map((item, idx) => {
              if (item.kind === 'task') {
                const t = item.task
                const isExpanded = expanded === t.id
                const color = dotColor(t.status)
                const dateNote = t.completedAt && sameDay(t.completedAt, date)
                  ? `Completed ${formatShort(t.completedAt)}`
                  : t.windowEnd && sameDay(t.windowEnd, date)
                    ? `Deadline ${formatShort(t.windowEnd)}`
                    : ''
                return (
                  <TouchableOpacity
                    key={`task-${t.id}`}
                    style={[mod.card, isExpanded && mod.cardExpanded]}
                    onPress={() => setExpanded(isExpanded ? null : t.id)}
                    activeOpacity={0.8}
                  >
                    <View style={mod.cardTop}>
                      <View style={[mod.accentBar, { backgroundColor: color }]} />
                      <View style={mod.cardMain}>
                        <View style={mod.cardTitleRow}>
                          <Text style={mod.taskTitle} numberOfLines={isExpanded ? undefined : 2}>{t.title}</Text>
                          <Text style={mod.expandChevron}>{isExpanded ? '▲' : '▼'}</Text>
                        </View>
                        <View style={mod.badgeRow}>
                          <View style={[mod.statusBadge, { backgroundColor: color + '22' }]}>
                            <Text style={[mod.statusText, { color }]}>{statusLabel(t.status)}</Text>
                          </View>
                          {dateNote ? <Text style={mod.dateNote}>{dateNote}</Text> : null}
                        </View>
                      </View>
                    </View>
                    {isExpanded && (
                      <View style={mod.detail}>
                        {t.why ? (
                          <View style={mod.whyBox}>
                            <Text style={mod.whyLabel}>WHY THIS MATTERS</Text>
                            <Text style={mod.whyText}>{t.why}</Text>
                          </View>
                        ) : null}
                        {t.description ? (
                          <>
                            <Text style={mod.detailLabel}>WHAT TO DO</Text>
                            <Text style={mod.detailText}>{t.description}</Text>
                          </>
                        ) : null}
                        {t.documents.length > 0 && (
                          <>
                            <Text style={mod.detailLabel}>DOCUMENTS NEEDED</Text>
                            {t.documents.map((d, i) => (
                              <Text key={i} style={mod.docItem}>· {d}</Text>
                            ))}
                          </>
                        )}
                      </View>
                    )}
                  </TouchableOpacity>
                )
              }

              if (item.kind === 'appointment') {
                return (
                  <View key={`appt-${item.taskId}`} style={[mod.card, { borderColor: APPT_COLOR + '66' }]}>
                    <View style={mod.cardTop}>
                      <View style={[mod.accentBar, { backgroundColor: APPT_COLOR }]} />
                      <View style={mod.cardMain}>
                        <View style={mod.badgeRow}>
                          <View style={[mod.statusBadge, { backgroundColor: APPT_COLOR + '22' }]}>
                            <Text style={[mod.statusText, { color: colors.goldDark }]}>📅 Appointment</Text>
                          </View>
                        </View>
                        <Text style={mod.taskTitle}>{item.taskTitle}</Text>
                      </View>
                    </View>
                  </View>
                )
              }

              if (item.kind === 'manual') {
                const e = item.entry
                return (
                  <View key={`entry-${e.id}`} style={[mod.card, { borderColor: ENTRY_COLOR + '66' }]}>
                    <View style={mod.cardTop}>
                      <View style={[mod.accentBar, { backgroundColor: ENTRY_COLOR }]} />
                      <View style={mod.cardMain}>
                        <View style={mod.badgeRow}>
                          <View style={[mod.statusBadge, { backgroundColor: ENTRY_COLOR + '22' }]}>
                            <Text style={[mod.statusText, { color: colors.sage }]}>Personal note</Text>
                          </View>
                        </View>
                        <Text style={mod.taskTitle}>{e.title}</Text>
                        {e.note ? <Text style={mod.entryNote}>{e.note}</Text> : null}
                      </View>
                      {onDeleteEntry && (
                        <TouchableOpacity
                          style={mod.deleteBtn}
                          onPress={() => onDeleteEntry(e.id)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text style={mod.deleteBtnText}>✕</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )
              }
              return null
            })}

            {/* Add note button — always shown */}
            {onAddNote && (
              <TouchableOpacity
                style={mod.addNoteBtn}
                onPress={() => { onAddNote(date); onClose() }}
                activeOpacity={0.8}
              >
                <Text style={mod.addNoteBtnText}>+ Add note for {formatLong(date)}</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const mod = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(44,40,37,0.45)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  sheet: {
    backgroundColor: colors.surface, borderRadius: radius.xl,
    padding: 22, width: '100%', maxWidth: 460, maxHeight: '80%',
    ...shadow.lifted,
  },
  header: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', marginBottom: 18,
    paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  dateLabel: { fontSize: 17, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  dateCount: { fontSize: 13, color: colors.textSoft, marginTop: 2 },
  closeX: { fontSize: 16, color: colors.textSoft, padding: 4 },

  card: {
    backgroundColor: colors.bg, borderRadius: radius.md,
    marginBottom: 10, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.border,
  },
  cardExpanded: { borderColor: colors.gold },
  cardTop: { flexDirection: 'row', alignItems: 'stretch' },
  accentBar: { width: 4, alignSelf: 'stretch' },
  cardMain: { flex: 1, padding: 12 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  taskTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.text, lineHeight: 20, marginTop: 4 },
  expandChevron: { fontSize: 10, color: colors.textMuted, marginTop: 4 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm },
  statusText: { fontSize: 11, fontWeight: '700' },
  dateNote: { fontSize: 11, color: colors.textMuted },
  entryNote: { fontSize: 13, color: colors.textSoft, marginTop: 4, lineHeight: 18 },
  deleteBtn: { padding: 12, justifyContent: 'center' },
  deleteBtnText: { fontSize: 14, color: colors.statusRed },
  detail: { paddingHorizontal: 14, paddingBottom: 14, paddingTop: 4 },
  whyBox: {
    backgroundColor: colors.goldLight, borderRadius: radius.sm,
    padding: 12, marginBottom: 12,
    borderLeftWidth: 3, borderLeftColor: colors.gold,
  },
  whyLabel: { fontSize: 9, fontWeight: '800', color: colors.goldDark, letterSpacing: 1, marginBottom: 5 },
  whyText: { fontSize: 13, color: colors.text, lineHeight: 20 },
  detailLabel: { fontSize: 9, fontWeight: '800', color: colors.textSoft, letterSpacing: 1, marginBottom: 5, marginTop: 4 },
  detailText: { fontSize: 13, color: colors.textSoft, lineHeight: 20, marginBottom: 8 },
  docItem: { fontSize: 13, color: colors.textSoft, marginBottom: 3 },

  addNoteBtn: {
    marginTop: 6, paddingVertical: 13,
    borderRadius: radius.md, borderWidth: 1.5,
    borderStyle: 'dashed' as any, borderColor: colors.gold,
    alignItems: 'center',
  },
  addNoteBtnText: { fontSize: 14, color: colors.gold, fontWeight: '600' },
})

// ── Tooltip helpers ───────────────────────────────────────────────────────────

type TooltipState = {
  items: ModalItem[]
  x: number   // clientX — viewport coords for position:fixed
  y: number   // clientY
}

function TooltipRows({ items }: { items: ModalItem[] }) {
  return (
    <>
      {items.map((item, idx) => {
        if (item.kind === 'task') {
          const color = dotColor(item.task.status)
          return (
            <View key={idx} style={tip.row}>
              <View style={[tip.dot, { backgroundColor: color }]} />
              <Text style={tip.label} numberOfLines={2}>{item.task.title}</Text>
              <Text style={[tip.badge, { color }]}>{statusLabel(item.task.status)}</Text>
            </View>
          )
        }
        if (item.kind === 'appointment') {
          return (
            <View key={idx} style={tip.row}>
              <View style={[tip.dot, { backgroundColor: APPT_COLOR }]} />
              <Text style={tip.label} numberOfLines={2}>{item.taskTitle}</Text>
              <Text style={[tip.badge, { color: colors.goldDark }]}>Appt</Text>
            </View>
          )
        }
        if (item.kind === 'manual') {
          return (
            <View key={idx} style={tip.row}>
              <View style={[tip.dot, { backgroundColor: ENTRY_COLOR }]} />
              <Text style={tip.label} numberOfLines={2}>{item.entry.title}</Text>
            </View>
          )
        }
        return null
      })}
    </>
  )
}

/** Desktop: follows the real cursor via a live window.mousemove ref */
function HoverTooltip({ tooltip }: { tooltip: TooltipState }) {
  const TOOLTIP_W = 220
  const OFFSET = 16
  const posRef = useRef({ x: tooltip.x, y: tooltip.y })
  const [pos, setPos] = useState({ x: tooltip.x, y: tooltip.y })

  useEffect(() => {
    function onMove(e: MouseEvent) {
      posRef.current = { x: e.clientX, y: e.clientY }
      setPos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  const vw = typeof window !== 'undefined' ? window.innerWidth : 800
  const vh = typeof window !== 'undefined' ? window.innerHeight : 600

  const nearRight = pos.x + TOOLTIP_W + OFFSET > vw - 8
  const left = nearRight ? pos.x - TOOLTIP_W - OFFSET : pos.x + OFFSET

  const nearBottom = pos.y + 160 > vh - 8
  const topStyle = nearBottom ? { top: pos.y - 160 } : { top: pos.y + OFFSET }

  return (
    <View style={[tip.box, { left, width: TOOLTIP_W }, topStyle]}>
      <TooltipRows items={tooltip.items} />
    </View>
  )
}

/** Mobile: inline card shown below the calendar grid on tap (compact mode only) */
function MobilePopup({ items, onClose }: { items: ModalItem[]; onClose: () => void }) {
  return (
    <View style={tip.mobileCard}>
      <View style={tip.mobileHeader}>
        <Text style={tip.mobileTitle}>On this date</Text>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={tip.mobileClose}>✕</Text>
        </TouchableOpacity>
      </View>
      <TooltipRows items={items} />
    </View>
  )
}

const tip = StyleSheet.create({
  // Desktop floating card
  box: {
    position: 'fixed' as any,
    zIndex: 9999,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
  },
  // Mobile inline card
  mobileCard: {
    marginTop: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 8,
  },
  mobileHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 4,
  },
  mobileTitle: { fontSize: 11, fontWeight: '700', color: colors.textSoft, textTransform: 'uppercase', letterSpacing: 0.6 },
  mobileClose: { fontSize: 14, color: colors.textMuted, paddingLeft: 8 },
  // Shared row styles
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  label: { flex: 1, fontSize: 12, color: colors.text, fontWeight: '500', lineHeight: 16 },
  badge: { fontSize: 10, fontWeight: '700', flexShrink: 0 },
})

// ── Helpers shared between hover and modal ────────────────────────────────────

function buildModalItems(
  dots: DotEntry[],
  timeline: ScheduledTask[],
  appointmentDates: Record<string, string>,
  calendarEntries: CalendarEntry[],
): ModalItem[] {
  const items: ModalItem[] = []
  for (const dot of dots) {
    if (dot.kind === 'task' && dot.taskId) {
      const task = timeline.find((t) => t.id === dot.taskId)
      if (task) items.push({ kind: 'task', task })
    } else if (dot.kind === 'appointment' && dot.taskId) {
      const task = timeline.find((t) => t.id === dot.taskId)
      if (task) items.push({ kind: 'appointment', taskId: dot.taskId, taskTitle: task.title, isoDate: appointmentDates[dot.taskId] })
    } else if (dot.kind === 'manual' && dot.entryId) {
      const entry = calendarEntries.find((e) => e.id === dot.entryId)
      if (entry) items.push({ kind: 'manual', entry })
    }
  }
  return items
}

// ── Main component ────────────────────────────────────────────────────────────

type Props = {
  timeline: ScheduledTask[]
  appointmentDates?: Record<string, string>
  calendarEntries?: CalendarEntry[]
  onDeleteEntry?: (id: string) => void
  onAddNoteForDate?: (date: Date) => void
  compact?: boolean
  initialYear?: number
  initialMonth?: number
}

export default function CalendarView({
  timeline,
  appointmentDates = {},
  calendarEntries = [],
  onDeleteEntry,
  onAddNoteForDate,
  compact = false,
  initialYear,
  initialMonth,
}: Props) {
  const today = new Date()
  const [year, setYear] = useState(initialYear ?? today.getFullYear())
  const [month, setMonth] = useState(initialMonth ?? today.getMonth())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedItems, setSelectedItems] = useState<ModalItem[]>([])
  const [hoverTooltip, setHoverTooltip] = useState<TooltipState | null>(null)  // desktop
  const [mobilePopupItems, setMobilePopupItems] = useState<ModalItem[] | null>(null)  // mobile compact

  // Keep a live cursor position on window so handleMouseEnter can seed the tooltip correctly
  useEffect(() => {
    function track(e: MouseEvent) {
      ;(window as any)._calCursorX = e.clientX
      ;(window as any)._calCursorY = e.clientY
    }
    window.addEventListener('mousemove', track)
    return () => window.removeEventListener('mousemove', track)
  }, [])

  // True on phones/tablets — no mouse hover, so skip the desktop floating tooltip
  const isTouchOnly = typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches

  const dotMap = buildDotMap(timeline, appointmentDates, calendarEntries)
  const firstDow = new Date(year, month, 1).getDay()
  const startOffset = firstDow === 0 ? 6 : firstDow - 1
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  function prevMonth() { month === 0 ? (setMonth(11), setYear((y) => y - 1)) : setMonth((m) => m - 1) }
  function nextMonth() { month === 11 ? (setMonth(0), setYear((y) => y + 1)) : setMonth((m) => m + 1) }

  function getItemsForDay(day: number): ModalItem[] {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return buildModalItems(dotMap[key] ?? [], timeline, appointmentDates, calendarEntries)
  }

  function handleDayPress(day: number) {
    if (compact) {
      // Mobile compact: tap a day with entries → show inline popup
      const items = getItemsForDay(day)
      if (items.length > 0) setMobilePopupItems(items)
      return
    }
    setHoverTooltip(null)
    const date = new Date(year, month, day)
    const items = getItemsForDay(day)
    setSelectedDate(date)
    setSelectedItems(items)
  }

  function handleMouseEnter(day: number) {
    const items = getItemsForDay(day)
    if (items.length === 0) return
    // Seed with current cursor position from the native DOM (bypasses RN event wrapping)
    const x = typeof window !== 'undefined' ? (window as any)._calCursorX ?? 0 : 0
    const y = typeof window !== 'undefined' ? (window as any)._calCursorY ?? 0 : 0
    setHoverTooltip({ items, x, y })
  }

  return (
    <View style={[cal.container, compact && cal.compact]}>
      <View style={cal.nav}>
        <TouchableOpacity onPress={prevMonth} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={cal.navArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={[cal.month, compact && cal.monthCompact]}>{MONTHS[month]} {year}</Text>
        <TouchableOpacity onPress={nextMonth} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={cal.navArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={cal.dayRow}>
        {DAY_LABELS.map((d) => (
          <View key={d} style={cal.dayHeaderCell}>
            <Text style={[cal.dayHeader, compact && cal.dayHeaderCompact]}>{d}</Text>
          </View>
        ))}
      </View>

      <View style={cal.grid}>
        {cells.map((day, idx) => {
          if (!day) return <View key={`e${idx}`} style={[cal.cell, compact && cal.cellCompact]} />
          const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const entries = dotMap[key] ?? []
          const cellDate = new Date(year, month, day)
          const isToday = sameDay(cellDate, today)
          const isPast = cellDate < today && !isToday
          const hasEntries = entries.length > 0

          return (
            <TouchableOpacity
              key={key}
              style={[cal.cell, compact && cal.cellCompact]}
              onPress={() => handleDayPress(day)}
              disabled={compact && !hasEntries}
              activeOpacity={hasEntries ? 0.7 : 0.9}
              // Desktop hover — only fires on non-touch devices
                      onMouseEnter={isTouchOnly ? undefined : () => handleMouseEnter(day)}
              onMouseLeave={isTouchOnly ? undefined : () => setHoverTooltip(null)}
            >
              <View style={[cal.dayBubble, isToday && cal.todayBubble]}>
                <Text style={[
                  cal.dayNum,
                  compact && cal.dayNumCompact,
                  isPast && cal.dayNumPast,
                  isToday && cal.dayNumToday,
                ]}>
                  {day}
                </Text>
              </View>
              {entries.length > 0 && (
                <View style={cal.dotRow}>
                  {entries.slice(0, 3).map((e, di) => (
                    <View key={di} style={[cal.dot, compact && cal.dotCompact, { backgroundColor: e.color }]} />
                  ))}
                </View>
              )}
            </TouchableOpacity>
          )
        })}
      </View>

      {!compact && (
        <View style={cal.legend}>
          {[
            { color: colors.statusGreen,  label: 'Completed' },
            { color: colors.statusPurple, label: 'In progress' },
            { color: colors.statusOrange, label: 'Due soon' },
            { color: colors.statusRed,    label: 'Overdue' },
            { color: colors.statusBlue,   label: 'Ready' },
            { color: APPT_COLOR,          label: 'Appointment' },
            { color: ENTRY_COLOR,         label: 'Personal note' },
          ].map(({ color, label }) => (
            <View key={label} style={cal.legendItem}>
              <View style={[cal.legendDot, { backgroundColor: color }]} />
              <Text style={cal.legendLabel}>{label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Mobile compact tap-popup — inline below the grid */}
      {compact && mobilePopupItems && (
        <MobilePopup items={mobilePopupItems} onClose={() => setMobilePopupItems(null)} />
      )}

      {/* Desktop hover tooltip — hidden on touch devices */}
      {!isTouchOnly && hoverTooltip && <HoverTooltip tooltip={hoverTooltip} />}

      {selectedDate && (
        <DayModal
          date={selectedDate}
          items={selectedItems}
          onClose={() => setSelectedDate(null)}
          onAddNote={onAddNoteForDate}
          onDeleteEntry={onDeleteEntry ? (id) => {
            onDeleteEntry(id)
            const remaining = selectedItems.filter((i) => !(i.kind === 'manual' && i.entry.id === id))
            if (remaining.length === 0) setSelectedDate(null)
            else setSelectedItems(remaining)
          } : undefined}
        />
      )}
    </View>
  )
}

const cal = StyleSheet.create({
  container: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 18, borderWidth: 1, borderColor: colors.border, ...shadow.card },
  compact: { padding: 12 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  navArrow: { fontSize: 22, color: colors.textSoft, lineHeight: 26, paddingHorizontal: 4 },
  month: { fontSize: 15, fontWeight: '700', color: colors.text },
  monthCompact: { fontSize: 13 },
  dayRow: { flexDirection: 'row', marginBottom: 6 },
  dayHeaderCell: { flex: 1, alignItems: 'center' },
  dayHeader: { fontSize: 11, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase' },
  dayHeaderCompact: { fontSize: 9 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%` as any, alignItems: 'center', justifyContent: 'flex-start', paddingVertical: 4, minHeight: 44 },
  cellCompact: { paddingVertical: 2, minHeight: 34 },
  dayBubble: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  todayBubble: { backgroundColor: colors.text },
  dayNum: { fontSize: 13, color: colors.text, fontWeight: '500' },
  dayNumCompact: { fontSize: 11 },
  dayNumPast: { color: colors.textMuted },
  dayNumToday: { color: colors.textInverse, fontWeight: '800' },
  dotRow: { flexDirection: 'row', gap: 2, marginTop: 3 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  dotCompact: { width: 4, height: 4 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11, color: colors.textSoft },
})
