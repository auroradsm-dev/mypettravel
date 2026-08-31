import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image } from 'react-native'
import { useAppStore, selectAppConfig, selectPetPhoto } from '../store/useAppStore'
import { PawPrint, PageBackground } from '../components/Illustrations'
import { colors, radius, shadow } from '../design/tokens'
import { supabase } from '../lib/supabase'


function formatDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

function parseDMY(value: string): Date | null {
  const parts = value.split('/')
  if (parts.length !== 3) return null
  const [d, m, y] = parts.map(Number)
  if (!d || !m || !y || y < 2024) return null
  const date = new Date(y, m - 1, d)
  if (date.getDate() !== d || date.getMonth() !== m - 1) return null
  return date
}

function toDisplayDate(isoString: string): string {
  const d = new Date(isoString)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

function pickImage(onPick: (dataUrl: string) => void) {
  const input = document.createElement('input')
  input.type = 'file'; input.accept = 'image/*'
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onPick(reader.result as string)
    reader.readAsDataURL(file)
  }
  input.click()
}

export default function ProfileScreen() {
  const userEmail = useAppStore((s) => s.userEmail)
  const onboarding = useAppStore((s) => s.onboarding)
  const petPhoto = useAppStore(selectPetPhoto)
  const appConfig = useAppStore(selectAppConfig)
  const updatePetName = useAppStore((s) => s.updatePetName)
  const updateTravelDate = useAppStore((s) => s.updateTravelDate)
  const setPetPhoto = useAppStore((s) => s.setPetPhoto)
  const resetOnboarding = useAppStore((s) => s.resetOnboarding)

  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(onboarding?.petName ?? '')
  const [editingDate, setEditingDate] = useState(false)
  const [dateValue, setDateValue] = useState(onboarding ? toDisplayDate(onboarding.travelDate) : '')
  const [dateError, setDateError] = useState('')

  if (!onboarding) return null

  const destLabel = onboarding.destinationCountry
    ? appConfig.supportedRoutes.euCountries.find((c) => c.code === onboarding.destinationCountry)?.name ?? onboarding.destination
    : onboarding.destination

  function handleSaveName() {
    const t = nameValue.trim(); if (!t) return
    updatePetName(t); setEditingName(false)
  }

  function handleSaveDate() {
    const date = parseDMY(dateValue)
    if (!date) { setDateError('Enter a valid date as DD/MM/YYYY'); return }
    if (date < new Date()) { setDateError("Travel date can't be in the past"); return }
    updateTravelDate(date); setEditingDate(false); setDateError('')
  }

  function handleReset() {
    if (window.confirm('This will delete your plan and all progress. Are you sure?')) resetOnboarding()
  }

  return (
    <View style={styles.wrapper}>
      <PageBackground variant="face" size={300} opacity={0.28} style={{ top: 80, right: -50 }} />
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Photo + name header */}
      <View style={styles.photoSection}>
        <TouchableOpacity style={styles.photoCircle} onPress={() => pickImage((uri) => setPetPhoto(uri))}>
          {petPhoto ? (
            <Image source={{ uri: petPhoto }} style={styles.photoImg} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <PawPrint size={40} opacity={0.5} />
              <Text style={styles.photoHint}>Add photo</Text>
            </View>
          )}
        </TouchableOpacity>
        {petPhoto && (
          <TouchableOpacity onPress={() => setPetPhoto(null)} style={styles.removePhoto}>
            <Text style={styles.removePhotoText}>Remove photo</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.photoName}>{onboarding.petName}</Text>
        <Text style={styles.photoSub}>{onboarding.petType === 'dog' ? '🐕 Dog' : '🐈 Cat'}  ·  {destLabel}</Text>
        {userEmail ? <Text style={styles.userEmail}>{userEmail}</Text> : null}
      </View>

      {/* Pet details */}
      <Text style={styles.sectionHead}>Pet details</Text>

      <FieldCard label="Name">
        {editingName ? (
          <EditRow
            value={nameValue}
            onChange={setNameValue}
            onSave={handleSaveName}
            onCancel={() => { setEditingName(false); setNameValue(onboarding.petName) }}
          />
        ) : (
          <ValueRow value={onboarding.petName} onEdit={() => { setEditingName(true); setNameValue(onboarding.petName) }} />
        )}
      </FieldCard>

      <FieldCard label="Travel date">
        {editingDate ? (
          <View>
            <EditRow
              value={dateValue}
              onChange={(v) => { setDateValue(formatDateInput(v)); setDateError('') }}
              onSave={handleSaveDate}
              onCancel={() => { setEditingDate(false); setDateError(''); setDateValue(toDisplayDate(onboarding.travelDate)) }}
              placeholder="DD/MM/YYYY"
              keyboardType="numbers-and-punctuation"
            />
            {dateError ? <Text style={styles.fieldError}>{dateError}</Text> : null}
          </View>
        ) : (
          <ValueRow value={toDisplayDate(onboarding.travelDate)} onEdit={() => { setEditingDate(true); setDateValue(toDisplayDate(onboarding.travelDate)) }} />
        )}
      </FieldCard>

      {/* Trip details */}
      <Text style={[styles.sectionHead, { marginTop: 28 }]}>Trip details</Text>

      <FieldCard label="From"><Text style={styles.fieldValue}>🇿🇦 {onboarding.origin} — South Africa</Text></FieldCard>
      <FieldCard label="To"><Text style={styles.fieldValue}>🇪🇺 {destLabel}</Text></FieldCard>
      <FieldCard label="Pet type"><Text style={styles.fieldValue}>{onboarding.petType === 'dog' ? 'Dog' : 'Cat'}</Text></FieldCard>
      {onboarding.airline && <FieldCard label="Airline"><Text style={styles.fieldValue}>{onboarding.airline}</Text></FieldCard>}
      {onboarding.petSize && (
        <FieldCard label="Travel method">
          <Text style={styles.fieldValue}>
            {onboarding.petSize === 'cabin' ? 'In cabin' : onboarding.petSize === 'hold' ? 'In hold' : 'As cargo'}
          </Text>
        </FieldCard>
      )}

      <View style={styles.routeNote}>
        <Text style={styles.routeNoteText}>
          To change your route, origin, or pet type, reset your plan below and start fresh.
        </Text>
      </View>

      <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
        <Text style={styles.resetBtnText}>Reset plan</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.signOutBtn}
        onPress={() => supabase.auth.signOut()}
      >
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>

    </ScrollView>
    </View>
  )
}

// Sub-components
function FieldCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={fc.card}>
      <Text style={fc.label}>{label}</Text>
      {children}
    </View>
  )
}

function ValueRow({ value, onEdit }: { value: string; onEdit: () => void }) {
  return (
    <TouchableOpacity style={fc.row} onPress={onEdit}>
      <Text style={fc.value}>{value}</Text>
      <Text style={fc.editLink}>Edit</Text>
    </TouchableOpacity>
  )
}

function EditRow({ value, onChange, onSave, onCancel, placeholder, keyboardType }: {
  value: string; onChange: (v: string) => void; onSave: () => void
  onCancel: () => void; placeholder?: string; keyboardType?: any
}) {
  return (
    <View style={fc.editRow}>
      <TextInput
        style={fc.input} value={value} onChangeText={onChange}
        autoFocus placeholder={placeholder} placeholderTextColor={colors.textMuted}
        returnKeyType="done" onSubmitEditing={onSave}
        keyboardType={keyboardType}
      />
      <TouchableOpacity style={fc.saveBtn} onPress={onSave}>
        <Text style={fc.saveBtnText}>Save</Text>
      </TouchableOpacity>
      <TouchableOpacity style={fc.cancelBtn} onPress={onCancel}>
        <Text style={fc.cancelBtnText}>✕</Text>
      </TouchableOpacity>
    </View>
  )
}

const fc = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  label: { fontSize: 10, fontWeight: '700', color: colors.textSoft, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  value: { fontSize: 15, color: colors.text, fontWeight: '500', flex: 1 },
  editLink: { fontSize: 13, color: colors.gold, fontWeight: '600' },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    flex: 1, backgroundColor: colors.bg, borderWidth: 1.5, borderColor: colors.gold,
    borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 8, fontSize: 15, color: colors.text,
  },
  saveBtn: { backgroundColor: colors.btnPrimary, borderRadius: radius.sm, paddingHorizontal: 14, paddingVertical: 8 },
  saveBtnText: { color: colors.btnPrimaryText, fontSize: 13, fontWeight: '600' },
  cancelBtn: { borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 8 },
  cancelBtnText: { color: colors.textSoft, fontSize: 14 },
})

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.bg, overflow: 'hidden' },
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { maxWidth: 900, width: '100%', alignSelf: 'center', padding: 24, paddingTop: 80, paddingBottom: 80 },

  photoSection: { alignItems: 'center', marginBottom: 32 },
  photoCircle: {
    width: 110, height: 110, borderRadius: 55, overflow: 'hidden',
    backgroundColor: colors.goldLight, borderWidth: 2.5, borderColor: colors.goldMid,
    marginBottom: 12,
  },
  photoImg: { width: '100%', height: '100%' },
  photoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  photoHint: { fontSize: 11, color: colors.gold, fontWeight: '600' },
  removePhoto: { marginTop: -4, marginBottom: 10 },
  removePhotoText: { fontSize: 12, color: colors.statusRed },
  photoName: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  photoSub: { fontSize: 14, color: colors.textSoft, marginTop: 3 },
  userEmail: { fontSize: 12, color: colors.textMuted, marginTop: 6 },

  sectionHead: { fontSize: 13, fontWeight: '700', color: colors.textSoft, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  fieldValue: { fontSize: 15, color: colors.text, fontWeight: '500' },
  fieldError: { fontSize: 12, color: colors.statusRed, marginTop: 6 },

  routeNote: { backgroundColor: colors.goldLight, borderRadius: radius.md, padding: 14, marginTop: 8 },
  routeNoteText: { fontSize: 13, color: colors.goldDark, lineHeight: 20 },

  resetBtn: { marginTop: 28, backgroundColor: colors.statusRedBg, borderRadius: radius.lg, paddingVertical: 15, alignItems: 'center', borderWidth: 1, borderColor: '#F5C6C6' },
  resetBtnText: { color: colors.statusRed, fontSize: 15, fontWeight: '600' },
  signOutBtn: { marginTop: 12, paddingVertical: 15, alignItems: 'center' },
  signOutText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
})
