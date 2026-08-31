import { useState, useRef, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Animated, ActivityIndicator, KeyboardAvoidingView,
} from 'react-native'
import { useAppStore } from '../store/useAppStore'
import { colors, radius, shadow } from '../design/tokens'

type Message = { role: 'user' | 'assistant'; content: string }

const API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_KEY ?? ''

function buildSystemPrompt(petName: string, origin: string, dest: string, travelDate: string): string {
  return `You are a warm, knowledgeable pet relocation assistant for My Pet Travel.
The user's pet is named ${petName}. They are relocating from ${origin} to ${dest}, travelling on ${travelDate}.
Help with: finding accredited/state vets, EU pet import regulations, airline AVIH policies, packing lists, keeping pets calm, document requirements and timing.
Be warm, practical, and concise. Keep answers brief and focused — this is a chat widget.`
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
      max_tokens: 600,
      system,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any)?.error?.message ?? `API error ${res.status}`)
  }
  const data = await res.json()
  return data.content?.[0]?.text ?? 'No response.'
}

const SUGGESTIONS = [
  'Where do I find a state vet?',
  'What goes in my document pack?',
  'How do I keep my dog calm on the flight?',
]

type Props = { visible?: boolean }

export default function FloatingAskClaude({ visible = true }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const scrollRef = useRef<ScrollView>(null)
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(20)).current
  const onboarding = useAppStore((s) => s.onboarding)

  useEffect(() => {
    Animated.parallel([
      Animated.spring(fadeAnim, { toValue: isOpen ? 1 : 0, useNativeDriver: true, bounciness: 0, speed: 20 }),
      Animated.spring(slideAnim, { toValue: isOpen ? 0 : 20, useNativeDriver: true, bounciness: 0, speed: 20 }),
    ]).start()
  }, [isOpen])

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }, [messages])

  if (!visible) return null

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

  return (
    <>
      {/* Chat pane */}
      <Animated.View
        style={[
          styles.pane,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            pointerEvents: isOpen ? 'auto' : 'none',
          } as any,
        ]}
      >
        {/* Pane header */}
        <View style={styles.paneHeader}>
          <View style={styles.paneHeaderLeft}>
            <Text style={styles.paneHeaderIcon}>✦</Text>
            <Text style={styles.paneTitle}>Ask Claude</Text>
          </View>
          <View style={styles.paneHeaderRight}>
            {messages.length > 0 && (
              <TouchableOpacity
                onPress={() => setMessages([])}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.clearBtn}
              >
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => setIsOpen(false)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.paneCloseX}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 && (
            <View style={styles.welcome}>
              <Text style={styles.welcomeText}>
                Hi! Ask me anything about {onboarding?.petName ?? 'your pet'}'s move.
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

        {/* Input row */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask anything…"
            placeholderTextColor={colors.textMuted}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnOff]}
            onPress={handleSend}
            disabled={!input.trim() || loading}
          >
            <Text style={styles.sendIcon}>↑</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Toggle button */}
      <TouchableOpacity
        style={[styles.toggle, isOpen && styles.toggleOpen]}
        onPress={() => setIsOpen((o) => !o)}
        activeOpacity={0.85}
      >
        <Text style={styles.toggleIcon}>{isOpen ? '✕' : '✦'}</Text>
        {!isOpen && <Text style={styles.toggleLabel}>Ask Claude</Text>}
      </TouchableOpacity>
    </>
  )
}

const PANE_WIDTH = 360
const PANE_HEIGHT = 500
const BOTTOM_OFFSET = 80

const styles = StyleSheet.create({
  pane: {
    position: 'absolute',
    bottom: BOTTOM_OFFSET,
    right: 20,
    width: PANE_WIDTH,
    height: PANE_HEIGHT,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    zIndex: 350,
    ...shadow.lifted,
  },

  paneHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  paneHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  paneHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  paneHeaderIcon: { fontSize: 16, color: colors.gold },
  paneTitle: { fontSize: 15, fontWeight: '800', color: colors.text, letterSpacing: -0.2 },
  clearBtn: { paddingHorizontal: 4 },
  clearBtnText: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  paneCloseX: { fontSize: 16, color: colors.textSoft },

  messages: { flex: 1 },
  messagesContent: { padding: 14, paddingBottom: 8, gap: 8 },

  welcome: { paddingVertical: 8 },
  welcomeText: { fontSize: 14, color: colors.textSoft, lineHeight: 22, marginBottom: 12 },
  chips: { gap: 6 },
  chip: {
    backgroundColor: colors.bg, borderRadius: radius.md,
    paddingHorizontal: 12, paddingVertical: 9,
    borderWidth: 1, borderColor: colors.border,
  },
  chipText: { fontSize: 13, color: colors.textSoft, lineHeight: 18 },

  bubble: { borderRadius: radius.lg, padding: 12, maxWidth: '88%' },
  bubbleUser: { backgroundColor: colors.text, alignSelf: 'flex-end' },
  bubbleAssistant: {
    backgroundColor: colors.bg, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: colors.border,
  },
  bubbleLabel: { fontSize: 9, fontWeight: '700', color: colors.gold, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 },
  bubbleText: { fontSize: 14, color: colors.text, lineHeight: 21 },
  bubbleTextUser: { color: colors.textInverse },

  errorBox: { backgroundColor: colors.statusRedBg, borderRadius: radius.md, padding: 10 },
  errorText: { fontSize: 12, color: colors.statusRed },

  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    padding: 12,
    borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1, backgroundColor: colors.bg,
    borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.lg, paddingHorizontal: 12, paddingVertical: 9,
    fontSize: 14, color: colors.text, maxHeight: 90,
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.btnPrimary,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnOff: { opacity: 0.3 },
  sendIcon: { color: colors.btnPrimaryText, fontSize: 18, fontWeight: '700', lineHeight: 20 },

  toggle: {
    position: 'absolute', bottom: 24, right: 24, zIndex: 360,
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: colors.text,
    borderRadius: radius.full,
    paddingVertical: 13, paddingHorizontal: 18,
    ...shadow.lifted,
  },
  toggleOpen: {
    paddingHorizontal: 16, paddingVertical: 13,
    borderRadius: radius.full,
  },
  toggleIcon: { fontSize: 16, color: colors.gold },
  toggleLabel: { fontSize: 14, fontWeight: '700', color: colors.textInverse },
})
