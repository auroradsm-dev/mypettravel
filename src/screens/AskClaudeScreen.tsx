import { useState, useRef, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, ActivityIndicator,
} from 'react-native'
import { useAppStore } from '../store/useAppStore'
import { colors, radius, shadow } from '../design/tokens'
import { PageBackground } from '../components/Illustrations'

type Message = { role: 'user' | 'assistant'; content: string }

// API key baked in via .env.local → EXPO_PUBLIC_ANTHROPIC_KEY
const API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_KEY ?? ''

function buildSystemPrompt(petName: string, origin: string, dest: string, travelDate: string): string {
  return `You are a warm, knowledgeable pet relocation assistant for My Pet Travel.

The user's pet is named ${petName}. They are relocating from ${origin} to ${dest}, travelling on ${travelDate}.

Help with:
- Finding accredited/state vets in South Africa
- Understanding EU pet import regulations
- Airline AVIH policies and procedures
- Packing lists and travel preparation
- Keeping pets calm during long flights
- Document requirements and timing
- Any other pet relocation questions

Be warm, practical, and concise. For local vet searches, suggest what to search and which bodies to contact (SAVC-registered vets, state vets at DALRRD offices) rather than specific listings you can't verify.`
}

async function callClaude(messages: Message[], system: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any)?.error?.message ?? `API error ${res.status}`)
  }
  const data = await res.json()
  return data.content?.[0]?.text ?? 'No response received.'
}

const SUGGESTIONS = [
  'Where do I find a SAVC-registered state vet in Cape Town?',
  'What should I pack in my dog\'s travel bag?',
  'How do I keep my dog calm on a long flight?',
  'What is an AVIH and how do I book one?',
  'What documents does EU customs check on arrival?',
]

export default function AskClaudeScreen() {
  const onboarding = useAppStore((s) => s.onboarding)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const scrollRef = useRef<ScrollView>(null)

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120)
    }
  }, [messages])

  const system = onboarding
    ? buildSystemPrompt(
        onboarding.petName,
        onboarding.origin,
        onboarding.destinationCountry ?? onboarding.destination,
        new Date(onboarding.travelDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      )
    : buildSystemPrompt('your pet', 'South Africa', 'the EU', 'your travel date')

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return

    const next: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setLoading(true)
    setError('')

    try {
      const reply = await callClaude(next, system)
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  // No API key configured
  if (!API_KEY || API_KEY.includes('REPLACE_WITH')) {
    return (
      <View style={styles.container}>
        <PageBackground variant="face" size={280} opacity={0.28} style={{ bottom: 0, right: -40 }} />
        <View style={styles.noKeyContainer}>
          <Text style={styles.noKeyIcon}>✦</Text>
          <Text style={styles.noKeyTitle}>Ask Claude</Text>
          <Text style={styles.noKeyBody}>
            To enable the AI assistant, add your Anthropic API key to the{' '}
            <Text style={styles.noKeyCode}>.env.local</Text> file in the project root:
          </Text>
          <View style={styles.codeBlock}>
            <Text style={styles.codeText}>EXPO_PUBLIC_ANTHROPIC_KEY=sk-ant-...</Text>
          </View>
          <Text style={styles.noKeyHint}>
            Get a free key at console.anthropic.com → API Keys, then restart the dev server.
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <PageBackground variant="face" size={280} opacity={0.28} style={{ top: 0, right: -40 }} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.eyebrow}>AI assistant</Text>
        <Text style={styles.title}>Ask Claude</Text>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.chat}
        contentContainerStyle={styles.chatContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Welcome state */}
        {messages.length === 0 && (
          <View style={styles.welcome}>
            <View style={styles.welcomeIconWrap}>
              <Text style={styles.welcomeIcon}>✦</Text>
            </View>
            <Text style={styles.welcomeTitle}>
              Hi! I know {onboarding?.petName ?? 'your pet'}'s full journey.{'\n'}What can I help with?
            </Text>
            <View style={styles.chips}>
              {SUGGESTIONS.map((s) => (
                <TouchableOpacity key={s} style={styles.chip} onPress={() => setInput(s)} activeOpacity={0.75}>
                  <Text style={styles.chipText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Bubbles */}
        {messages.map((msg, i) => (
          <View key={i} style={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant]}>
            {msg.role === 'assistant' && <Text style={styles.bubbleLabel}>✦  Claude</Text>}
            <Text style={[styles.bubbleText, msg.role === 'user' && styles.bubbleTextUser]}>
              {msg.content}
            </Text>
          </View>
        ))}

        {loading && (
          <View style={[styles.bubble, styles.bubbleAssistant]}>
            <Text style={styles.bubbleLabel}>✦  Claude</Text>
            <ActivityIndicator size="small" color={colors.gold} style={{ marginTop: 6 }} />
          </View>
        )}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️  {error}</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask anything about your pet's move…"
          placeholderTextColor={colors.textMuted}
          multiline
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnOff]}
          onPress={handleSend}
          disabled={!input.trim() || loading}
        >
          <Text style={styles.sendBtnText}>↑</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, overflow: 'hidden' },

  // No-key state
  noKeyContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: 36, maxWidth: 440, alignSelf: 'center',
  },
  noKeyIcon: { fontSize: 36, color: colors.gold, marginBottom: 14 },
  noKeyTitle: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 14, letterSpacing: -0.3 },
  noKeyBody: { fontSize: 15, color: colors.textSoft, lineHeight: 24, textAlign: 'center', marginBottom: 16 },
  noKeyCode: { fontFamily: 'monospace', color: colors.text, fontWeight: '600' },
  codeBlock: {
    backgroundColor: colors.text, borderRadius: radius.md,
    paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16, width: '100%',
  },
  codeText: { color: colors.textInverse, fontFamily: 'monospace', fontSize: 13 },
  noKeyHint: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },

  // Header
  header: {
    paddingHorizontal: 24, paddingTop: 80, paddingBottom: 12,
    maxWidth: 900, width: '100%', alignSelf: 'center',
  },
  eyebrow: { fontSize: 11, fontWeight: '700', color: colors.gold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },

  // Chat
  chat: { flex: 1 },
  chatContent: {
    padding: 16, paddingBottom: 12,
    maxWidth: 900, width: '100%', alignSelf: 'center',
  },

  welcome: { alignItems: 'center', paddingVertical: 20 },
  welcomeIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.goldLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  welcomeIcon: { fontSize: 24, color: colors.gold },
  welcomeTitle: {
    fontSize: 17, fontWeight: '600', color: colors.text,
    textAlign: 'center', lineHeight: 26, marginBottom: 20,
  },
  chips: { gap: 8, width: '100%' },
  chip: {
    backgroundColor: colors.surface, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 11,
    borderWidth: 1, borderColor: colors.border,
  },
  chipText: { fontSize: 14, color: colors.textSoft, lineHeight: 20 },

  bubble: { borderRadius: radius.lg, padding: 14, marginBottom: 10, maxWidth: '88%' },
  bubbleUser: { backgroundColor: colors.text, alignSelf: 'flex-end' },
  bubbleAssistant: {
    backgroundColor: colors.surface, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: colors.border, ...shadow.card,
  },
  bubbleLabel: {
    fontSize: 10, fontWeight: '700', color: colors.gold,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6,
  },
  bubbleText: { fontSize: 15, color: colors.text, lineHeight: 23 },
  bubbleTextUser: { color: colors.textInverse },

  errorBox: { backgroundColor: colors.statusRedBg, borderRadius: radius.md, padding: 12, marginTop: 4 },
  errorText: { fontSize: 13, color: colors.statusRed, lineHeight: 20 },

  // Input
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    padding: 14, paddingBottom: 24,
    borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: colors.surface,
    maxWidth: 900, width: '100%', alignSelf: 'center',
  },
  input: {
    flex: 1, backgroundColor: colors.bg,
    borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 15, color: colors.text, maxHeight: 120,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.btnPrimary,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnOff: { opacity: 0.3 },
  sendBtnText: { color: colors.btnPrimaryText, fontSize: 20, fontWeight: '700', lineHeight: 22 },
})
