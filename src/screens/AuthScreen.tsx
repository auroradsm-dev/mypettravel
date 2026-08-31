import { useState } from 'react'
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, ScrollView, ActivityIndicator,
} from 'react-native'
import { supabase } from '../lib/supabase'
import { DogIllustration, PageBackground } from '../components/Illustrations'
import { colors, radius, shadow } from '../design/tokens'

type Mode = 'login' | 'register' | 'forgot'

export default function AuthScreen() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function reset() { setError(''); setSuccess('') }

  // ── Email / password ────────────────────────────────────────────────────────

  async function handleSubmit() {
    reset()
    const e = email.trim().toLowerCase()
    const p = password

    if (!e) { setError('Please enter your email address.'); return }
    if (mode !== 'forgot' && p.length < 6) { setError('Password must be at least 6 characters.'); return }

    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: e, password: p })
        if (error) throw error
        // Session is set — App.tsx will re-render with user

      } else if (mode === 'register') {
        const { error } = await supabase.auth.signUp({
          email: e, password: p,
          options: { emailRedirectTo: window.location.origin },
        })
        if (error) throw error
        setSuccess('Check your email for a confirmation link, then come back to sign in.')
        setMode('login')

      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(e, {
          redirectTo: window.location.origin,
        })
        if (error) throw error
        setSuccess('Password reset email sent — check your inbox.')
        setMode('login')
      }
    } catch (err: any) {
      setError(friendlyError(err?.message ?? 'Something went wrong. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  // ── Google OAuth ────────────────────────────────────────────────────────────

  async function handleGoogle() {
    reset()
    setGoogleLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      })
      if (error) throw error
      // Browser redirects to Google — no further code needed here
    } catch (err: any) {
      setError(friendlyError(err?.message ?? 'Google sign-in failed. Please try again.'))
      setGoogleLoading(false)
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function friendlyError(msg: string): string {
    if (msg.includes('Invalid login credentials')) return 'Incorrect email or password.'
    if (msg.includes('Email not confirmed')) return 'Please confirm your email first — check your inbox.'
    if (msg.includes('already registered')) return 'An account with this email already exists. Try signing in.'
    if (msg.includes('Password should be')) return 'Password must be at least 6 characters.'
    if (msg.includes('Unable to validate')) return 'Invalid email address.'
    return msg
  }

  const isLogin = mode === 'login'
  const isRegister = mode === 'register'
  const isForgot = mode === 'forgot'

  const heading = isLogin ? 'Welcome back' : isRegister ? 'Create your account' : 'Reset password'
  const btnLabel = isLogin ? 'Sign in' : isRegister ? 'Create account' : 'Send reset link'

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <PageBackground variant="seated" size={340} opacity={0.12} style={{ top: -20, right: -60 }} />
      <PageBackground variant="walk" size={280} opacity={0.07} style={{ bottom: 40, left: -60 }} />

      {/* Brand */}
      <View style={styles.brand}>
        <DogIllustration size={80} />
        <Text style={styles.brandName}>MY PET TRAVEL</Text>
        <Text style={styles.brandTagline}>Your pet's relocation companion</Text>
      </View>

      {/* Card */}
      <View style={styles.card}>
        <Text style={styles.heading}>{heading}</Text>

        {success ? (
          <View style={styles.successBox}>
            <Text style={styles.successText}>✓  {success}</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Email */}
        <Text style={styles.label}>Email address</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={(v) => { setEmail(v); reset() }}
          placeholder="you@example.com"
          placeholderTextColor={colors.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType={isForgot ? 'done' : 'next'}
          onSubmitEditing={isForgot ? handleSubmit : undefined}
        />

        {/* Password (hidden for forgot) */}
        {!isForgot && (
          <>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={(v) => { setPassword(v); reset() }}
              placeholder={isRegister ? 'At least 6 characters' : '••••••••'}
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
          </>
        )}

        {/* Forgot password link */}
        {isLogin && (
          <TouchableOpacity style={styles.forgotLink} onPress={() => { setMode('forgot'); reset() }}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>
        )}

        {/* Primary button */}
        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color={colors.btnPrimaryText} size="small" />
            : <Text style={styles.btnText}>{btnLabel}</Text>}
        </TouchableOpacity>

        {/* Divider + Google (not on forgot) */}
        {!isForgot && (
          <>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={[styles.googleBtn, googleLoading && styles.btnDisabled]}
              onPress={handleGoogle}
              disabled={googleLoading}
              activeOpacity={0.85}
            >
              {googleLoading
                ? <ActivityIndicator color={colors.text} size="small" />
                : (
                  <>
                    <Text style={styles.googleIcon}>G</Text>
                    <Text style={styles.googleText}>Continue with Google</Text>
                  </>
                )}
            </TouchableOpacity>
          </>
        )}

        {/* Toggle login / register */}
        <View style={styles.toggleRow}>
          {isForgot ? (
            <TouchableOpacity onPress={() => { setMode('login'); reset() }}>
              <Text style={styles.toggleText}>← Back to sign in</Text>
            </TouchableOpacity>
          ) : isLogin ? (
            <>
              <Text style={styles.toggleMuted}>Don't have an account?  </Text>
              <TouchableOpacity onPress={() => { setMode('register'); reset() }}>
                <Text style={styles.toggleLink}>Create one</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.toggleMuted}>Already have an account?  </Text>
              <TouchableOpacity onPress={() => { setMode('login'); reset() }}>
                <Text style={styles.toggleLink}>Sign in</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>
        Your data is stored securely. Documents stay on your device.
      </Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    flexGrow: 1, maxWidth: 480, width: '100%', alignSelf: 'center',
    padding: 24, paddingTop: 60, paddingBottom: 60,
    justifyContent: 'center',
  },

  brand: { alignItems: 'center', marginBottom: 32 },
  brandName: {
    fontSize: 12, fontWeight: '800', color: colors.gold,
    letterSpacing: 2.5, marginTop: 10, marginBottom: 4,
  },
  brandTagline: { fontSize: 13, color: colors.textMuted },

  card: {
    backgroundColor: colors.surface, borderRadius: radius.xl,
    padding: 28, borderWidth: 1, borderColor: colors.border,
    ...shadow.lifted,
  },
  heading: {
    fontSize: 22, fontWeight: '800', color: colors.text,
    letterSpacing: -0.3, marginBottom: 20,
  },

  successBox: {
    backgroundColor: colors.statusGreenBg, borderRadius: radius.md,
    padding: 12, marginBottom: 16,
  },
  successText: { fontSize: 13, color: colors.statusGreen, fontWeight: '600', lineHeight: 20 },

  errorBox: {
    backgroundColor: colors.statusRedBg, borderRadius: radius.md,
    padding: 12, marginBottom: 16,
    borderLeftWidth: 3, borderLeftColor: colors.statusRed,
  },
  errorText: { fontSize: 13, color: colors.statusRed, lineHeight: 20 },

  label: {
    fontSize: 12, fontWeight: '700', color: colors.textSoft,
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6,
  },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, color: colors.text, marginBottom: 16,
  },

  forgotLink: { alignSelf: 'flex-end', marginTop: -8, marginBottom: 20 },
  forgotText: { fontSize: 13, color: colors.gold, fontWeight: '600' },

  btn: {
    backgroundColor: colors.btnPrimary,
    borderRadius: radius.lg, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center',
    minHeight: 52, ...shadow.card,
  },
  btnDisabled: { opacity: 0.55 },
  btnText: { color: colors.btnPrimaryText, fontSize: 16, fontWeight: '700' },

  divider: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, marginVertical: 20,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontSize: 13, color: colors.textMuted },

  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.lg, paddingVertical: 14,
    borderWidth: 1.5, borderColor: colors.border,
    minHeight: 52, ...shadow.card,
  },
  googleIcon: {
    fontSize: 16, fontWeight: '800',
    color: '#4285F4',   // Google blue
    width: 22, textAlign: 'center',
  },
  googleText: { fontSize: 15, fontWeight: '600', color: colors.text },

  toggleRow: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', marginTop: 22, flexWrap: 'wrap',
  },
  toggleMuted: { fontSize: 14, color: colors.textMuted },
  toggleLink: { fontSize: 14, color: colors.gold, fontWeight: '700' },
  toggleText: { fontSize: 14, color: colors.gold, fontWeight: '600' },

  footer: {
    fontSize: 12, color: colors.textMuted,
    textAlign: 'center', marginTop: 24, lineHeight: 18,
  },
})
