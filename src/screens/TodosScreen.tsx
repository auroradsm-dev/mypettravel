import { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput,
} from 'react-native'
import { useAppStore } from '../store/useAppStore'
import { colors, radius, shadow } from '../design/tokens'
import { PageBackground } from '../components/Illustrations'

export default function TodosScreen() {
  const todos = useAppStore((s) => s.todos)
  const addTodo = useAppStore((s) => s.addTodo)
  const toggleTodo = useAppStore((s) => s.toggleTodo)
  const deleteTodo = useAppStore((s) => s.deleteTodo)

  const [input, setInput] = useState('')

  const pending = todos.filter((t) => !t.done)
  const done = todos.filter((t) => t.done)

  function handleAdd() {
    const text = input.trim()
    if (!text) return
    addTodo(text)
    setInput('')
  }

  return (
    <View style={styles.wrapper}>
      <PageBackground variant="face" size={260} opacity={0.28} style={{ bottom: 0, right: -30 }} />
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Personal list</Text>
          <Text style={styles.title}>To-do list</Text>
          <Text style={styles.sub}>Things to buy, organise, or remember — not part of the official timeline.</Text>
        </View>
      </View>

      {/* Add input */}
      <View style={styles.addRow}>
        <TextInput
          style={styles.addInput}
          value={input}
          onChangeText={setInput}
          placeholder="Add a to-do…"
          placeholderTextColor={colors.textMuted}
          returnKeyType="done"
          onSubmitEditing={handleAdd}
        />
        <TouchableOpacity
          style={[styles.addBtn, !input.trim() && styles.addBtnDisabled]}
          onPress={handleAdd}
          disabled={!input.trim()}
        >
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Empty state */}
      {todos.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📝</Text>
          <Text style={styles.emptyTitle}>Nothing here yet</Text>
          <Text style={styles.emptySub}>Add things to pack, book, or buy for your pet's journey.</Text>
        </View>
      )}

      {/* Pending */}
      {pending.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>To do  ·  {pending.length}</Text>
          {pending.map((todo) => (
            <TodoRow
              key={todo.id}
              text={todo.text}
              done={false}
              onToggle={() => toggleTodo(todo.id)}
              onDelete={() => deleteTodo(todo.id)}
            />
          ))}
        </View>
      )}

      {/* Done */}
      {done.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Done  ·  {done.length}</Text>
          {done.map((todo) => (
            <TodoRow
              key={todo.id}
              text={todo.text}
              done={true}
              onToggle={() => toggleTodo(todo.id)}
              onDelete={() => deleteTodo(todo.id)}
            />
          ))}
        </View>
      )}

    </ScrollView>
    </View>
  )
}

function TodoRow({ text, done, onToggle, onDelete }: {
  text: string; done: boolean; onToggle: () => void; onDelete: () => void
}) {
  return (
    <View style={[row.container, done && row.containerDone]}>
      <TouchableOpacity style={[row.check, done && row.checkDone]} onPress={onToggle}>
        {done && <Text style={row.checkMark}>✓</Text>}
      </TouchableOpacity>
      <Text style={[row.text, done && row.textDone]} numberOfLines={3}>{text}</Text>
      <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={row.delete}>✕</Text>
      </TouchableOpacity>
    </View>
  )
}

const row = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, borderRadius: radius.md,
    padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: colors.border,
    ...shadow.card,
  },
  containerDone: { opacity: 0.6 },
  check: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkDone: { backgroundColor: colors.statusGreen, borderColor: colors.statusGreen },
  checkMark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  text: { flex: 1, fontSize: 15, color: colors.text, lineHeight: 21 },
  textDone: { textDecorationLine: 'line-through', color: colors.textMuted },
  delete: { fontSize: 14, color: colors.textMuted, paddingLeft: 4 },
})

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.bg, overflow: 'hidden' },
  container: { flex: 1, backgroundColor: 'transparent' },
  scroll: { maxWidth: 900, width: '100%', alignSelf: 'center', padding: 24, paddingTop: 80, paddingBottom: 60 },

  header: { marginBottom: 22 },
  eyebrow: { fontSize: 11, fontWeight: '700', color: colors.gold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  sub: { fontSize: 13, color: colors.textMuted, marginTop: 4, lineHeight: 19 },

  addRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  addInput: {
    flex: 1, backgroundColor: colors.surface,
    borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: colors.text,
  },
  addBtn: {
    backgroundColor: colors.btnPrimary,
    borderRadius: radius.md, paddingHorizontal: 18, justifyContent: 'center',
  },
  addBtnDisabled: { opacity: 0.4 },
  addBtnText: { color: colors.btnPrimaryText, fontSize: 14, fontWeight: '700' },

  section: { marginBottom: 24 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textSoft,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
  },

  emptyState: { alignItems: 'center', paddingTop: 48, paddingBottom: 32 },
  emptyEmoji: { fontSize: 40, marginBottom: 14 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 6 },
  emptySub: { fontSize: 14, color: colors.textSoft, textAlign: 'center', lineHeight: 21, maxWidth: 280 },
})
