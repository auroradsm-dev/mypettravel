import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native'
import {
  useAppStore, selectTimeline, selectAppointmentDates, selectCalendarEntries,
} from '../store/useAppStore'
import CalendarView from '../components/CalendarView'
import { PawPrint, PageBackground } from '../components/Illustrations'
import { colors, radius, shadow } from '../design/tokens'

function formatDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

function parseDMY(value: string): string | null {
  const parts = value.split('/')
  if (parts.length !== 3) return null
  const [d, m, y] = parts.map(Number)
  if (!d || !m || !y || y < 2020) return null
  const date = new Date(y, m - 1, d)
  if (date.getDate() !== d || date.getMonth() !== m - 1) return null
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function dateToDMY(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

function todayDMY(): string { return dateToDMY(new Date()) }

function AddEntryModal({ initialDate, onClose, onSave }: {
  initialDate?: Date
  onClose: () => void
  onSave: (title: string, date: string, note?: string) => void
}) {
  const [title, setTitle] = useState('')
  const [dateValue, setDateValue] = useState(initialDate ? dateToDMY(initialDate) : todayDMY())
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<{ title?: string; date?: string }>({})

  function handleSave() {
    const errs: { title?: string; date?: string } = {}
    if (!title.trim()) errs.title = 'Please enter a title.'
    const isoDate = parseDMY(dateValue)
    if (!isoDate) errs.date = 'Enter a valid date as DD/MM/YYYY.'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    onSave(title.trim(), isoDate!, note.trim() || undefined)
    onClose()
  }

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      {/* Backdrop and sheet are siblings — prevents backdrop swallowing TextInput taps */}
      <View style={add.overlay} pointerEvents="box-none">
        {/* Tap-to-close backdrop sits behind the sheet */}
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

        {/* Sheet — no touch propagation issues since it's not inside the backdrop */}
        <View style={add.sheet}>
          <View style={add.header}>
            <Text style={add.heading}>Add calendar note</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={add.closeX}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={add.label}>Title *</Text>
          <TextInput
            style={[add.input, errors.title ? add.inputError : null]}
            value={title}
            onChangeText={(v) => { setTitle(v); setErrors((e) => ({ ...e, title: undefined })) }}
            placeholder="e.g. Vet callback, Document ready…"
            placeholderTextColor={colors.textMuted}
            autoFocus
          />
          {errors.title ? <Text style={add.error}>{errors.title}</Text> : null}

          <Text style={add.label}>Date *</Text>
          <TextInput
            style={[add.input, errors.date ? add.inputError : null]}
            value={dateValue}
            onChangeText={(v) => { setDateValue(formatDateInput(v)); setErrors((e) => ({ ...e, date: undefined })) }}
            placeholder="DD/MM/YYYY"
            placeholderTextColor={colors.textMuted}
            keyboardType="numbers-and-punctuation"
          />
          {errors.date ? <Text style={add.error}>{errors.date}</Text> : null}

          <Text style={add.label}>Note (optional)</Text>
          <TextInput
            style={[add.input, add.inputMulti]}
            value={note}
            onChangeText={setNote}
            placeholder="Any extra details…"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <View style={add.actions}>
            <TouchableOpacity style={add.cancelBtn} onPress={onClose}>
              <Text style={add.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={add.saveBtn} onPress={handleSave}>
              <Text style={add.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const add = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(44,40,37,0.45)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  sheet: {
    backgroundColor: colors.surface, borderRadius: radius.xl,
    padding: 24, width: '100%', maxWidth: 440,
    ...shadow.lifted,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  heading: { fontSize: 18, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  closeX: { fontSize: 16, color: colors.textSoft, padding: 4 },
  label: {
    fontSize: 11, fontWeight: '700', color: colors.textSoft,
    textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 6,
  },
  input: {
    backgroundColor: colors.bg, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: colors.text, marginBottom: 14,
  },
  inputMulti: { minHeight: 72 },
  inputError: { borderColor: colors.statusRed },
  error: { fontSize: 12, color: colors.statusRed, marginTop: -10, marginBottom: 10 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1, paddingVertical: 13, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  cancelText: { fontSize: 15, color: colors.textSoft, fontWeight: '500' },
  saveBtn: {
    flex: 1, paddingVertical: 13, borderRadius: radius.lg,
    backgroundColor: colors.btnPrimary, alignItems: 'center',
  },
  saveText: { fontSize: 15, color: colors.btnPrimaryText, fontWeight: '700' },
})

export default function CalendarScreen() {
  const timeline = useAppStore(selectTimeline)
  const appointmentDates = useAppStore(selectAppointmentDates)
  const calendarEntries = useAppStore(selectCalendarEntries)
  const addCalendarEntry = useAppStore((s) => s.addCalendarEntry)
  const deleteCalendarEntry = useAppStore((s) => s.deleteCalendarEntry)

  const [addNoteDate, setAddNoteDate] = useState<Date | undefined>(undefined)
  const [showAdd, setShowAdd] = useState(false)

  function handleAddNoteForDate(date: Date) {
    setAddNoteDate(date)
    setShowAdd(true)
  }

  function handleAddNoteOpen() {
    setAddNoteDate(undefined)
    setShowAdd(true)
  }

  return (
    <View style={styles.container}>
      <PageBackground variant="face" size={280} opacity={0.28} style={{ bottom: 0, right: -40 }} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.inner}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Your schedule</Text>
            <Text style={styles.title}>Calendar</Text>
            <Text style={styles.sub}>Tap any date to view or add a note.</Text>
          </View>
          <PawPrint size={34} opacity={0.35} />
        </View>
        <CalendarView
          timeline={timeline}
          appointmentDates={appointmentDates}
          calendarEntries={calendarEntries}
          onDeleteEntry={deleteCalendarEntry}
          onAddNoteForDate={handleAddNoteForDate}
        />
      </ScrollView>

      {/* FAB — add note (left side to avoid conflict with Ask Claude button) */}
      <TouchableOpacity style={styles.fab} onPress={handleAddNoteOpen} activeOpacity={0.85}>
        <Text style={styles.fabIcon}>+</Text>
        <Text style={styles.fabLabel}>Add note</Text>
      </TouchableOpacity>

      {showAdd && (
        <AddEntryModal
          initialDate={addNoteDate}
          onClose={() => { setShowAdd(false); setAddNoteDate(undefined) }}
          onSave={(title, date, note) => addCalendarEntry(title, date, note)}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, overflow: 'hidden' },
  scroll: { flex: 1 },
  inner: { maxWidth: 900, width: '100%', alignSelf: 'center', padding: 24, paddingTop: 80, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 },
  eyebrow: { fontSize: 11, fontWeight: '700', color: colors.gold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  sub: { fontSize: 13, color: colors.textMuted, marginTop: 3 },

  fab: {
    position: 'absolute', bottom: 28, left: 24,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.btnPrimary, borderRadius: radius.full,
    paddingVertical: 13, paddingHorizontal: 20,
    ...shadow.lifted,
  },
  fabIcon: { fontSize: 20, color: colors.btnPrimaryText, lineHeight: 22 },
  fabLabel: { fontSize: 14, fontWeight: '700', color: colors.btnPrimaryText },
})
