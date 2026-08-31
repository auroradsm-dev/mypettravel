import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native'
import { useNavigation } from '../navigation/NavigationContext'
import { useAppStore, selectTimeline, selectAppConfig, selectAppointmentDates } from '../store/useAppStore'
import { colors, radius, shadow } from '../design/tokens'
import { PageBackground } from '../components/Illustrations'

// Tasks that require a bookable appointment date shown on the calendar
const APPOINTMENT_TASK_IDS = ['private_vet_appointment', 'eu_health_certificate', 'state_vet_endorsement']

function formatDate(date: Date | null): string {
  if (!date) return ''
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function parseDMY(value: string): Date | null {
  const parts = value.split('/')
  if (parts.length !== 3) return null
  const [d, m, y] = parts.map(Number)
  if (!d || !m || !y || y < 2020) return null
  const date = new Date(y, m - 1, d)
  if (date.getDate() !== d || date.getMonth() !== m - 1) return null
  return date
}

function formatDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

export default function TaskScreen({ taskId }: { taskId: string }) {
  const { goBack } = useNavigation()
  const timeline = useAppStore(selectTimeline)
  const appConfig = useAppStore(selectAppConfig)
  const markComplete = useAppStore((s) => s.markTaskComplete)
  const markIncomplete = useAppStore((s) => s.markTaskIncomplete)
  const markInProgress = useAppStore((s) => s.markTaskInProgress)
  const setTaskNote = useAppStore((s) => s.setTaskNote)
  const savedNote = useAppStore((s) => s.userNotes[taskId] ?? '')
  const appointmentDates = useAppStore(selectAppointmentDates)
  const setAppointmentDate = useAppStore((s) => s.setAppointmentDate)

  const savedApptIso = appointmentDates[taskId] ?? null
  // Convert stored YYYY-MM-DD → DD/MM/YYYY for display
  function isoToDMY(iso: string): string {
    const [y, m, d] = iso.split('-')
    return `${d}/${m}/${y}`
  }

  const [showDatePicker, setShowDatePicker] = useState(false)
  const [completionDate, setCompletionDate] = useState(
    formatDateInput(new Date().toLocaleDateString('en-GB').replace(/\//g, ''))
  )
  const [dateError, setDateError] = useState('')
  const [noteText, setNoteText] = useState(savedNote)

  // Appointment date state
  const [editingAppt, setEditingAppt] = useState(false)
  const [apptValue, setApptValue] = useState(savedApptIso ? isoToDMY(savedApptIso) : '')
  const [apptError, setApptError] = useState('')

  const showApptSection = APPOINTMENT_TASK_IDS.includes(taskId)

  function handleSaveAppt() {
    if (!apptValue.trim()) {
      // Clear the appointment
      setAppointmentDate(taskId, null)
      setEditingAppt(false)
      return
    }
    const date = parseDMY(apptValue)
    if (!date) { setApptError('Enter a valid date as DD/MM/YYYY'); return }
    setAppointmentDate(taskId, date)
    setEditingAppt(false)
    setApptError('')
  }

  const task = timeline.find((t) => t.id === taskId)

  if (!task) {
    return (
      <View style={styles.wrapper}>
        <TouchableOpacity onPress={goBack} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ padding: 24, color: colors.textSoft }}>Task not found.</Text>
      </View>
    )
  }

  const isComplete = task.status === 'completed'
  const isInProgress = task.status === 'in_progress'
  const isMilestone = task.type === 'milestone'

  function handleMarkDone() {
    setShowDatePicker(true)
    const today = new Date()
    const dd = String(today.getDate()).padStart(2, '0')
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const yyyy = today.getFullYear()
    setCompletionDate(`${dd}/${mm}/${yyyy}`)
    setDateError('')
  }

  function handleConfirmDate() {
    const date = parseDMY(completionDate)
    if (!date) { setDateError('Enter a valid date as DD/MM/YYYY'); return }
    if (date > new Date()) { setDateError("Date can't be in the future"); return }

    const { windowStart, windowEnd } = task!
    let warning = ''
    if (windowStart && date < windowStart) {
      warning = `This date is before the earliest valid date (${formatDate(windowStart)}). Are you sure?`
    } else if (windowEnd && date > windowEnd) {
      warning = `This date is after the deadline (${formatDate(windowEnd)}). This step may be invalid. Continue?`
    }

    const proceed = () => { markComplete(task!.id, date); setShowDatePicker(false); goBack() }
    if (warning) { if (window.confirm(warning)) proceed() } else { proceed() }
  }

  function handleUndo() {
    if (window.confirm('Mark this step as not done? This will affect dependent steps.')) {
      markIncomplete(task!.id); setShowDatePicker(false)
    }
  }

  function handleMarkInProgress() { markInProgress(task!.id); goBack() }

  function handleNoteSilentSave() { setTaskNote(task!.id, noteText.trim()) }

  function handleNoteSave() { setTaskNote(task!.id, noteText.trim()); goBack() }

  return (
    <View style={styles.wrapper}>
      <PageBackground variant="walk" size={300} opacity={0.26} style={{ bottom: 60, right: -40 }} />
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.back} onPress={goBack}>
        <Text style={styles.backText}>← Back to plan</Text>
      </TouchableOpacity>

      {/* Category + title */}
      <Text style={styles.category}>{appConfig.categoryLabels[task.category]}</Text>
      <Text style={styles.title}>{task.title}</Text>

      {isComplete && task.completedAt && (
        <View style={styles.completedBadge}>
          <Text style={styles.completedBadgeText}>✓  Done on {formatDate(task.completedAt)}</Text>
        </View>
      )}

      {/* Why box */}
      <View style={styles.whyBox}>
        <Text style={styles.whyLabel}>Why this matters</Text>
        <Text style={styles.whyText}>{task.why}</Text>
      </View>

      {/* What to do */}
      <Text style={styles.sectionLabel}>What to do</Text>
      <Text style={styles.body}>{task.description}</Text>

      {/* Documents */}
      {task.documents.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Documents needed</Text>
          <View style={styles.docList}>
            {task.documents.map((doc, i) => (
              <View key={i} style={styles.docRow}>
                <View style={styles.docDot} />
                <Text style={styles.docText}>{doc}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Timing */}
      {(task.windowStart || task.windowEnd) && (
        <View style={styles.timingBox}>
          <Text style={styles.timingLabel}>Timing</Text>
          {task.windowStart && <Text style={styles.timingText}>Earliest: {formatDate(task.windowStart)}</Text>}
          {task.windowEnd && <Text style={styles.timingText}>Deadline: {formatDate(task.windowEnd)}</Text>}
        </View>
      )}

      {/* Appointment date */}
      {showApptSection && (
        <View style={styles.apptBox}>
          <View style={styles.apptHeader}>
            <Text style={styles.apptTitle}>📅  Appointment date</Text>
            {!editingAppt && (
              <TouchableOpacity onPress={() => { setEditingAppt(true); setApptValue(savedApptIso ? isoToDMY(savedApptIso) : '') }}>
                <Text style={styles.apptEditLink}>{savedApptIso ? 'Change' : 'Set date'}</Text>
              </TouchableOpacity>
            )}
          </View>
          {savedApptIso && !editingAppt && (
            <Text style={styles.apptValue}>
              {new Date(savedApptIso + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
          )}
          {!savedApptIso && !editingAppt && (
            <Text style={styles.apptPlaceholder}>No date set — tap "Set date" to add it to your calendar.</Text>
          )}
          {editingAppt && (
            <View style={styles.apptEditRow}>
              <TextInput
                style={[styles.apptInput, apptError ? styles.apptInputError : null]}
                value={apptValue}
                onChangeText={(v) => { setApptValue(formatDateInput(v)); setApptError('') }}
                placeholder="DD/MM/YYYY"
                placeholderTextColor={colors.textMuted}
                keyboardType="numbers-and-punctuation"
                autoFocus
              />
              <TouchableOpacity style={styles.apptSaveBtn} onPress={handleSaveAppt}>
                <Text style={styles.apptSaveBtnText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.apptCancelBtn} onPress={() => { setEditingAppt(false); setApptError('') }}>
                <Text style={styles.apptCancelText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          {apptError ? <Text style={styles.apptErrorText}>{apptError}</Text> : null}
          <Text style={styles.apptHint}>This date appears on your calendar as a reminder.</Text>
        </View>
      )}

      {/* Rule notes */}
      {task.notes && (
        <>
          <Text style={styles.sectionLabel}>Notes</Text>
          <Text style={styles.notes}>{task.notes}</Text>
        </>
      )}

      {/* Failure instruction */}
      {task.failureInstruction && (
        <View style={styles.failureBox}>
          <Text style={styles.failureLabel}>If this step fails</Text>
          <Text style={styles.failureText}>{task.failureInstruction}</Text>
        </View>
      )}

      {/* My notes */}
      <View style={styles.myNotesBox}>
        <Text style={styles.sectionLabel}>My notes</Text>
        <TextInput
          style={styles.myNotesInput}
          value={noteText}
          onChangeText={setNoteText}
          onBlur={handleNoteSilentSave}
          placeholder="Add your own notes, reference numbers, contacts…"
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        {noteText !== savedNote && (
          <TouchableOpacity style={styles.saveNoteBtn} onPress={handleNoteSave}>
            <Text style={styles.saveNoteBtnText}>Save note</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Action area */}
      {!isMilestone && (
        <View style={styles.actionArea}>
          {!isComplete && !showDatePicker && (
            <View style={styles.primaryActions}>
              <TouchableOpacity style={styles.btnPrimary} onPress={handleMarkDone} activeOpacity={0.85}>
                <Text style={styles.btnPrimaryText}>Mark as done</Text>
              </TouchableOpacity>
              {!isInProgress && (
                <TouchableOpacity style={styles.btnInProgress} onPress={handleMarkInProgress} activeOpacity={0.85}>
                  <Text style={styles.btnInProgressText}>Mark as in progress</Text>
                </TouchableOpacity>
              )}
              {isInProgress && (
                <View style={styles.inProgressBadge}>
                  <View style={styles.inProgressDot} />
                  <Text style={styles.inProgressBadgeText}>In progress</Text>
                </View>
              )}
            </View>
          )}

          {!isComplete && showDatePicker && (
            <View style={styles.datePicker}>
              <Text style={styles.datePickerTitle}>When did you complete this?</Text>
              <Text style={styles.datePickerSub}>Used to calculate dependent step deadlines.</Text>
              <TextInput
                style={[styles.dateInput, dateError ? styles.dateInputError : null]}
                value={completionDate}
                onChangeText={(v) => { setCompletionDate(formatDateInput(v)); setDateError('') }}
                placeholder="DD/MM/YYYY"
                placeholderTextColor={colors.textMuted}
                keyboardType="numbers-and-punctuation"
                autoFocus
              />
              {dateError ? <Text style={styles.dateError}>{dateError}</Text> : null}
              <View style={styles.dateActions}>
                <TouchableOpacity style={styles.dateCancel} onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.dateCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dateConfirm} onPress={handleConfirmDate}>
                  <Text style={styles.dateConfirmText}>Confirm date</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {isComplete && (
            <TouchableOpacity style={styles.btnUndo} onPress={handleUndo}>
              <Text style={styles.btnUndoText}>Mark as not done</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {isMilestone && (
        <View style={styles.milestoneNote}>
          <Text style={styles.milestoneNoteText}>
            This milestone resolves automatically once the date is reached.{'\n'}
            Status: {appConfig.statusLabels[task.status]}
          </Text>
        </View>
      )}
    </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.bg, overflow: 'hidden' },
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { maxWidth: 900, width: '100%', alignSelf: 'center', padding: 32, paddingTop: 56, paddingBottom: 80 },

  back: { marginBottom: 28 },
  backText: { fontSize: 14, color: colors.textSoft, fontWeight: '500' },

  category: {
    fontSize: 11, color: colors.gold, textTransform: 'uppercase',
    letterSpacing: 1, marginBottom: 8, fontWeight: '700',
  },
  title: {
    fontSize: 26, fontWeight: '800', color: colors.text,
    marginBottom: 16, lineHeight: 33, letterSpacing: -0.3,
  },

  completedBadge: {
    backgroundColor: colors.statusGreenBg, borderRadius: radius.md,
    paddingHorizontal: 12, paddingVertical: 7,
    alignSelf: 'flex-start', marginBottom: 20,
  },
  completedBadgeText: { fontSize: 13, fontWeight: '700', color: colors.statusGreen },

  whyBox: {
    backgroundColor: colors.goldLight, borderRadius: radius.lg,
    padding: 18, marginBottom: 24,
    borderLeftWidth: 3, borderLeftColor: colors.gold,
  },
  whyLabel: {
    fontSize: 11, fontWeight: '700', color: colors.goldDark,
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8,
  },
  whyText: { fontSize: 15, color: colors.text, lineHeight: 23 },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textSoft,
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: 8, marginTop: 22,
  },
  body: { fontSize: 15, color: colors.text, lineHeight: 24 },

  docList: { gap: 8 },
  docRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  docDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: colors.gold, marginTop: 8,
  },
  docText: { fontSize: 15, color: colors.text, flex: 1, lineHeight: 24 },

  timingBox: {
    backgroundColor: colors.goldLight, borderRadius: radius.md,
    padding: 16, marginTop: 16, gap: 4,
  },
  timingLabel: {
    fontSize: 11, fontWeight: '700', color: colors.goldDark,
    marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8,
  },
  timingText: { fontSize: 14, color: colors.text },

  notes: { fontSize: 14, color: colors.textSoft, lineHeight: 22, fontStyle: 'italic' },

  failureBox: {
    backgroundColor: colors.statusRedBg, borderRadius: radius.md,
    padding: 16, marginTop: 16,
    borderLeftWidth: 3, borderLeftColor: colors.statusRed,
  },
  failureLabel: {
    fontSize: 11, fontWeight: '700', color: colors.statusRed,
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8,
  },
  failureText: { fontSize: 14, color: colors.text, lineHeight: 22 },

  myNotesBox: { marginTop: 4 },
  myNotesInput: {
    backgroundColor: colors.surface, borderWidth: 1.5,
    borderColor: colors.border, borderRadius: radius.md,
    padding: 14, fontSize: 14, color: colors.text,
    lineHeight: 21, minHeight: 100,
  },
  saveNoteBtn: {
    marginTop: 8, alignSelf: 'flex-end',
    backgroundColor: colors.btnPrimary,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.md,
  },
  saveNoteBtnText: { color: colors.btnPrimaryText, fontSize: 13, fontWeight: '600' },

  actionArea: { marginTop: 32 },
  primaryActions: { gap: 10 },

  btnPrimary: {
    backgroundColor: colors.btnPrimary, paddingVertical: 16,
    borderRadius: radius.lg, alignItems: 'center', ...shadow.card,
  },
  btnPrimaryText: { color: colors.btnPrimaryText, fontSize: 16, fontWeight: '700' },

  btnUndo: {
    backgroundColor: colors.surfaceAlt, paddingVertical: 15,
    borderRadius: radius.lg, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  btnUndoText: { color: colors.textSoft, fontSize: 15, fontWeight: '500' },

  btnInProgress: {
    paddingVertical: 14, borderRadius: radius.lg, alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.statusPurple,
  },
  btnInProgressText: { color: colors.statusPurple, fontSize: 15, fontWeight: '600' },

  inProgressBadge: {
    backgroundColor: colors.statusPurpleBg, borderRadius: radius.lg,
    paddingVertical: 12, alignItems: 'center', flexDirection: 'row',
    justifyContent: 'center', gap: 8,
  },
  inProgressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.statusPurple },
  inProgressBadgeText: { color: colors.statusPurple, fontSize: 14, fontWeight: '600' },

  datePicker: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: 20, borderWidth: 1, borderColor: colors.border, ...shadow.card,
  },
  datePickerTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 5 },
  datePickerSub: { fontSize: 13, color: colors.textSoft, lineHeight: 19, marginBottom: 16 },
  dateInput: {
    backgroundColor: colors.bg, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 16, color: colors.text, marginBottom: 4,
  },
  dateInputError: { borderColor: colors.statusRed },
  dateError: { fontSize: 13, color: colors.statusRed, marginBottom: 12 },
  dateActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  dateCancel: {
    flex: 1, paddingVertical: 12, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  dateCancelText: { fontSize: 14, color: colors.textSoft, fontWeight: '500' },
  dateConfirm: {
    flex: 1, paddingVertical: 12, borderRadius: radius.md,
    backgroundColor: colors.btnPrimary, alignItems: 'center',
  },
  dateConfirmText: { fontSize: 14, color: colors.btnPrimaryText, fontWeight: '600' },

  milestoneNote: {
    backgroundColor: colors.surfaceAlt, borderRadius: radius.md,
    padding: 16, marginTop: 32,
  },
  milestoneNoteText: { fontSize: 14, color: colors.textSoft, lineHeight: 22 },

  // Appointment date
  apptBox: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: 16, marginTop: 20,
    borderWidth: 1.5, borderColor: colors.gold,
  },
  apptHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  apptTitle: { fontSize: 13, fontWeight: '700', color: colors.goldDark },
  apptEditLink: { fontSize: 13, color: colors.gold, fontWeight: '600' },
  apptValue: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 6 },
  apptPlaceholder: { fontSize: 13, color: colors.textMuted, marginBottom: 6 },
  apptEditRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  apptInput: {
    flex: 1, backgroundColor: colors.bg, borderWidth: 1.5, borderColor: colors.gold,
    borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 8, fontSize: 15, color: colors.text,
  },
  apptInputError: { borderColor: colors.statusRed },
  apptSaveBtn: { backgroundColor: colors.btnPrimary, borderRadius: radius.sm, paddingHorizontal: 14, paddingVertical: 8 },
  apptSaveBtnText: { color: colors.btnPrimaryText, fontSize: 13, fontWeight: '600' },
  apptCancelBtn: { borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 8 },
  apptCancelText: { color: colors.textSoft, fontSize: 14 },
  apptErrorText: { fontSize: 12, color: colors.statusRed, marginBottom: 6 },
  apptHint: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
})
