import { useState } from 'react'
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native'
import { useNavigation } from '../navigation/NavigationContext'
import { useAppStore } from '../store/useAppStore'
import { getRuleSetId } from '../engine/configLoader'
import type { OnboardingData } from '../store/useAppStore'
import { PawPrint } from '../components/Illustrations'
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

export default function SetupScreen() {
  const { replace } = useNavigation()
  const completeOnboarding = useAppStore((s) => s.completeOnboarding)
  const appConfig = useAppStore((s) => s.appConfig)

  const [petName, setPetName] = useState('')
  const [travelDate, setTravelDate] = useState('')
  const [destinationCountry, setDestinationCountry] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showCountryPicker, setShowCountryPicker] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')

  const origin = appConfig.supportedRoutes.origins[0]
  const destination = appConfig.supportedRoutes.destinations[0]
  const petType = 'dog' as const
  const euCountries = appConfig.supportedRoutes.euCountries
  const selectedCountry = euCountries.find((c) => c.code === destinationCountry)
  const filteredCountries = countrySearch.trim()
    ? euCountries.filter((c) => c.name.toLowerCase().includes(countrySearch.toLowerCase()))
    : euCountries

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!petName.trim()) e.petName = "What's your dog's name?"
    if (!destinationCountry) e.destinationCountry = 'Please select your destination country'
    if (!travelDate) e.travelDate = 'Please enter your travel date'
    else if (!parseDMY(travelDate)) e.travelDate = 'Enter a valid date as DD/MM/YYYY'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleContinue() {
    if (!validate()) return
    const travel = parseDMY(travelDate)!
    const daysUntilTravel = Math.floor((travel.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    const minDays = appConfig.timeline.monthsApproximateDays * 5

    const proceed = () => {
      const data: OnboardingData = {
        origin, destination, destinationCountry, petType,
        petName: petName.trim(),
        travelDate: travel.toISOString(),
        petSize: 'hold',
      }
      try {
        getRuleSetId(origin, destination, petType, destinationCountry)
        completeOnboarding(data)
        replace({ name: 'home' })
      } catch {
        setErrors({ general: 'Could not load rules for this route. Please try again.' })
      }
    }

    if (daysUntilTravel < minDays) {
      const ok = window.confirm(
        `This move typically requires at least ${minDays} days preparation. You have ${daysUntilTravel} days — some steps may already be overdue.\n\nThe app will show you exactly where you stand. Continue?`
      )
      if (ok) proceed()
    } else {
      proceed()
    }
  }

  return (
    <View style={styles.root}>
      {/* Sign out — always accessible during onboarding */}
      <TouchableOpacity style={styles.signOutBtn} onPress={() => supabase.auth.signOut()}>
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>

    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.inner}>
        {/* Header */}
        <View style={styles.headerRow}>
          <PawPrint size={28} opacity={0.7} />
          <Text style={styles.headerBrand}>My Pet Travel</Text>
        </View>
        <Text style={styles.title}>Tell us about{'\n'}your move</Text>
        <Text style={styles.subtitle}>We'll build a personalised relocation checklist.</Text>

        {/* Pet name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Your dog's name</Text>
          <TextInput
            style={[styles.input, errors.petName ? styles.inputError : null]}
            placeholder="e.g. Jax"
            placeholderTextColor={colors.textMuted}
            value={petName}
            onChangeText={(v) => { setPetName(v); setErrors((e) => ({ ...e, petName: '' })) }}
            autoCapitalize="words"
          />
          {errors.petName ? <Text style={styles.errorText}>{errors.petName}</Text> : null}
        </View>

        {/* Destination country */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Destination in the EU</Text>
          <TouchableOpacity
            style={[styles.input, styles.picker, errors.destinationCountry ? styles.inputError : null,
              showCountryPicker && styles.inputFocused]}
            onPress={() => setShowCountryPicker(!showCountryPicker)}
          >
            <Text style={selectedCountry ? styles.pickerValue : styles.pickerPlaceholder}>
              {selectedCountry
                ? `${selectedCountry.name}${selectedCountry.hasOverride ? '  ✦' : ''}`
                : 'Select country'}
            </Text>
            <Text style={styles.chevron}>{showCountryPicker ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {errors.destinationCountry
            ? <Text style={styles.errorText}>{errors.destinationCountry}</Text>
            : null}

          {showCountryPicker && (
            <View style={styles.countryList}>
              <TextInput
                style={styles.countrySearch}
                placeholder="Search country…"
                placeholderTextColor={colors.textMuted}
                value={countrySearch}
                onChangeText={setCountrySearch}
                autoFocus
              />
              <ScrollView style={{ maxHeight: 220 }}>
                {filteredCountries.map((c) => (
                  <TouchableOpacity
                    key={c.code}
                    style={[
                      styles.countryItem,
                      destinationCountry === c.code && styles.countryItemSelected,
                    ]}
                    onPress={() => {
                      setDestinationCountry(c.code)
                      setShowCountryPicker(false)
                      setCountrySearch('')
                      setErrors((e) => ({ ...e, destinationCountry: '' }))
                    }}
                  >
                    <Text style={[
                      styles.countryText,
                      destinationCountry === c.code && styles.countryTextSelected,
                    ]}>
                      {c.name}
                    </Text>
                    {c.hasOverride && (
                      <Text style={styles.countryExtraTag}>Extra requirements</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {selectedCountry?.hasOverride && (
            <View style={styles.overrideNote}>
              <Text style={styles.overrideNoteText}>
                ✦  {selectedCountry.name} has additional entry requirements — these are included in your plan.
              </Text>
            </View>
          )}
        </View>

        {/* Travel date */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Travel date</Text>
          <TextInput
            style={[styles.input, errors.travelDate ? styles.inputError : null]}
            placeholder="DD/MM/YYYY"
            placeholderTextColor={colors.textMuted}
            value={travelDate}
            onChangeText={(v) => {
              setTravelDate(formatDateInput(v))
              setErrors((e) => ({ ...e, travelDate: '' }))
            }}
            keyboardType="numbers-and-punctuation"
          />
          {errors.travelDate ? <Text style={styles.errorText}>{errors.travelDate}</Text> : null}
        </View>

        {/* Route info */}
        <View style={styles.routeChip}>
          <Text style={styles.routeChipText}>🇿🇦 South Africa  →  🇪🇺 EU  ·  Dog</Text>
        </View>

        {errors.general && (
          <View style={styles.generalError}>
            <Text style={styles.generalErrorText}>{errors.general}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.btn} onPress={handleContinue} activeOpacity={0.85}>
          <Text style={styles.btnText}>Build my plan  →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  signOutBtn: {
    position: 'absolute', top: 20, right: 20, zIndex: 100,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  signOutText: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  container: { flexGrow: 1 },
  inner: {
    maxWidth: 480, width: '100%', alignSelf: 'center',
    padding: 32, paddingTop: 60, paddingBottom: 60,
  },

  headerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 32,
  },
  headerBrand: {
    fontSize: 15, fontWeight: '800', color: colors.gold, letterSpacing: 1,
  },

  title: {
    fontSize: 32, fontWeight: '800', color: colors.text,
    lineHeight: 40, marginBottom: 10, letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15, color: colors.textSoft, lineHeight: 22, marginBottom: 36,
  },

  // Form fields
  fieldGroup: { marginBottom: 24 },
  label: {
    fontSize: 12, fontWeight: '700', color: colors.textSoft,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  inputError: { borderColor: colors.statusRed },
  inputFocused: { borderColor: colors.gold },
  errorText: { fontSize: 13, color: colors.statusRed, marginTop: 6 },

  // Country picker
  picker: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  pickerValue: { fontSize: 16, color: colors.text },
  pickerPlaceholder: { fontSize: 16, color: colors.textMuted },
  chevron: { fontSize: 11, color: colors.textSoft },
  countryList: {
    backgroundColor: colors.surface,
    borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.md, marginTop: 6, overflow: 'hidden',
    ...shadow.card,
  },
  countrySearch: {
    paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 15, color: colors.text,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  countryItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  countryItemSelected: { backgroundColor: colors.goldLight },
  countryText: { fontSize: 15, color: colors.text },
  countryTextSelected: { fontWeight: '700', color: colors.goldDark },
  countryExtraTag: { fontSize: 11, color: colors.statusOrange, fontWeight: '600' },
  overrideNote: {
    backgroundColor: colors.goldLight, borderRadius: radius.sm,
    padding: 12, marginTop: 8,
  },
  overrideNoteText: { fontSize: 13, color: colors.goldDark, lineHeight: 19 },

  // Route chip
  routeChip: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.full,
    paddingHorizontal: 16, paddingVertical: 10,
    alignSelf: 'flex-start', marginBottom: 28,
  },
  routeChipText: { fontSize: 13, color: colors.textSoft, fontWeight: '600' },

  generalError: {
    backgroundColor: colors.statusRedBg, borderRadius: radius.md,
    padding: 14, marginBottom: 16,
  },
  generalErrorText: { fontSize: 14, color: colors.statusRed },

  btn: {
    backgroundColor: colors.btnPrimary,
    paddingVertical: 17, borderRadius: radius.lg, alignItems: 'center',
  },
  btnText: { color: colors.btnPrimaryText, fontSize: 17, fontWeight: '700' },
})
