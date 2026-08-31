import { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Modal } from 'react-native'
import { useAppStore, selectTimeline } from '../store/useAppStore'
import type { DocumentItem } from '../store/useAppStore'
import { colors, radius, shadow } from '../design/tokens'
import { PageBackground } from '../components/Illustrations'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function mimeIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType === 'application/pdf') return '📄'
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
  if (mimeType.includes('sheet') || mimeType.includes('excel') || mimeType.includes('csv')) return '📊'
  return '📎'
}

function mimeLabel(mimeType: string): string {
  if (mimeType.startsWith('image/')) return mimeType.split('/')[1].toUpperCase()
  if (mimeType === 'application/pdf') return 'PDF'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'Word'
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'Excel'
  if (mimeType.includes('csv')) return 'CSV'
  return 'File'
}

function openDocument(doc: DocumentItem) {
  const a = document.createElement('a')
  a.href = doc.dataUri; a.target = '_blank'; a.rel = 'noopener noreferrer'
  a.click()
}

function downloadDocument(doc: DocumentItem) {
  const a = document.createElement('a')
  a.href = doc.dataUri; a.download = doc.name
  a.click()
}

function shareDocument(doc: DocumentItem) {
  const subject = encodeURIComponent(`Document: ${doc.name}`)
  const body = encodeURIComponent(
    `I'm sharing a document with you: ${doc.name}\n\nType: ${mimeLabel(doc.mimeType)}  ·  Size: ${formatBytes(doc.size)}\n\nThis document is part of a pet relocation dossier.`
  )
  window.open(`mailto:?subject=${subject}&body=${body}`, '_self')
}

function pickFile(onPick: (doc: Omit<DocumentItem, 'id' | 'uploadedAt'>) => void) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt'
  input.multiple = true
  input.onchange = (e) => {
    const files = Array.from((e.target as HTMLInputElement).files ?? [])
    files.forEach((file) => {
      if (file.size > 8 * 1024 * 1024) {
        alert(`"${file.name}" is too large (max 8 MB).`)
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        onPick({ name: file.name, mimeType: file.type || 'application/octet-stream', size: file.size, dataUri: reader.result as string })
      }
      reader.readAsDataURL(file)
    })
  }
  input.click()
}

// ── Preview modal ─────────────────────────────────────────────────────────────

function PreviewModal({ doc, taskTitle, onClose, onDelete }: {
  doc: DocumentItem
  taskTitle?: string
  onClose: () => void
  onDelete: () => void
}) {
  const isImage = doc.mimeType.startsWith('image/')

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={pm.overlay} activeOpacity={1} onPress={onClose}>
        <View style={pm.sheet} onStartShouldSetResponder={() => true}>

          {/* Header */}
          <View style={pm.header}>
            <Text style={pm.docIcon}>{mimeIcon(doc.mimeType)}</Text>
            <View style={pm.headerInfo}>
              <Text style={pm.docName} numberOfLines={2}>{doc.name}</Text>
              <View style={pm.metaRow}>
                <Text style={pm.metaText}>{mimeLabel(doc.mimeType)}</Text>
                <Text style={pm.metaDot}>·</Text>
                <Text style={pm.metaText}>{formatBytes(doc.size)}</Text>
                <Text style={pm.metaDot}>·</Text>
                <Text style={pm.metaText}>{formatDate(doc.uploadedAt)}</Text>
              </View>
              {taskTitle && (
                <View style={pm.taskTag}>
                  <Text style={pm.taskTagText}>📋 {taskTitle}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={pm.closeX}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Image preview */}
          {isImage && (
            <View style={pm.imageWrap}>
              <Image source={{ uri: doc.dataUri }} style={pm.image} resizeMode="contain" />
            </View>
          )}

          {/* Non-image: info card */}
          {!isImage && (
            <View style={pm.previewPlaceholder}>
              <Text style={pm.previewBigIcon}>{mimeIcon(doc.mimeType)}</Text>
              <Text style={pm.previewHint}>Tap "Open" to view in a new tab</Text>
            </View>
          )}

          {/* Actions */}
          <View style={pm.actions}>
            <TouchableOpacity style={pm.btnPrimary} onPress={() => openDocument(doc)} activeOpacity={0.85}>
              <Text style={pm.btnPrimaryText}>Open</Text>
            </TouchableOpacity>
            <TouchableOpacity style={pm.btnSecondary} onPress={() => downloadDocument(doc)} activeOpacity={0.85}>
              <Text style={pm.btnSecondaryText}>Download</Text>
            </TouchableOpacity>
            <TouchableOpacity style={pm.btnSecondary} onPress={() => shareDocument(doc)} activeOpacity={0.85}>
              <Text style={pm.btnSecondaryText}>Share via email</Text>
            </TouchableOpacity>
          </View>

          {/* Delete */}
          <TouchableOpacity style={pm.deleteBtn} onPress={onDelete}>
            <Text style={pm.deleteBtnText}>Remove document</Text>
          </TouchableOpacity>

        </View>
      </TouchableOpacity>
    </Modal>
  )
}

const pm = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(44,40,37,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  sheet: {
    backgroundColor: colors.surface, borderRadius: radius.xl,
    width: '100%', maxWidth: 500, ...shadow.lifted,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  docIcon: { fontSize: 28, width: 36, textAlign: 'center', marginTop: 2 },
  headerInfo: { flex: 1 },
  docName: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 5, lineHeight: 21 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  metaText: { fontSize: 12, color: colors.textMuted },
  metaDot: { fontSize: 12, color: colors.textMuted },
  taskTag: {
    marginTop: 6, alignSelf: 'flex-start',
    backgroundColor: colors.goldLight, borderRadius: radius.sm,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  taskTagText: { fontSize: 11, fontWeight: '600', color: colors.goldDark },
  closeX: { fontSize: 16, color: colors.textSoft, padding: 2 },

  imageWrap: { backgroundColor: colors.bg, padding: 12 },
  image: { width: '100%', height: 260 },

  previewPlaceholder: {
    alignItems: 'center', paddingVertical: 40,
    backgroundColor: colors.bg,
  },
  previewBigIcon: { fontSize: 52, marginBottom: 10 },
  previewHint: { fontSize: 13, color: colors.textMuted },

  actions: { flexDirection: 'row', gap: 8, padding: 16, flexWrap: 'wrap' },
  btnPrimary: {
    backgroundColor: colors.btnPrimary, borderRadius: radius.md,
    paddingVertical: 11, paddingHorizontal: 20,
  },
  btnPrimaryText: { color: colors.btnPrimaryText, fontSize: 14, fontWeight: '700' },
  btnSecondary: {
    backgroundColor: colors.surfaceAlt, borderRadius: radius.md,
    paddingVertical: 11, paddingHorizontal: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  btnSecondaryText: { color: colors.text, fontSize: 14, fontWeight: '600' },

  deleteBtn: { alignSelf: 'center', paddingVertical: 12, paddingHorizontal: 20, marginBottom: 4 },
  deleteBtnText: { fontSize: 13, color: colors.statusRed, fontWeight: '600' },
})

// ── Document row ──────────────────────────────────────────────────────────────

function DocRow({ doc, taskTitle, onPress }: {
  doc: DocumentItem
  taskTitle?: string
  onPress: () => void
}) {
  return (
    <TouchableOpacity style={dr.container} onPress={onPress} activeOpacity={0.8}>
      <Text style={dr.icon}>{mimeIcon(doc.mimeType)}</Text>
      <View style={dr.info}>
        <Text style={dr.name} numberOfLines={1}>{doc.name}</Text>
        <View style={dr.meta}>
          <Text style={dr.metaText}>{mimeLabel(doc.mimeType)}</Text>
          <Text style={dr.metaDot}>·</Text>
          <Text style={dr.metaText}>{formatBytes(doc.size)}</Text>
          <Text style={dr.metaDot}>·</Text>
          <Text style={dr.metaText}>{formatDate(doc.uploadedAt)}</Text>
          {taskTitle && (
            <>
              <Text style={dr.metaDot}>·</Text>
              <Text style={dr.taskTag}>{taskTitle}</Text>
            </>
          )}
        </View>
      </View>
      <Text style={dr.chevron}>›</Text>
    </TouchableOpacity>
  )
}

const dr = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, borderRadius: radius.md,
    padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: colors.border, ...shadow.card,
  },
  icon: { fontSize: 22, width: 30, textAlign: 'center' },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 3 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  metaText: { fontSize: 12, color: colors.textMuted },
  metaDot: { fontSize: 12, color: colors.textMuted },
  taskTag: {
    fontSize: 11, fontWeight: '600', color: colors.goldDark,
    backgroundColor: colors.goldLight,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  chevron: { fontSize: 18, color: colors.textMuted, paddingLeft: 4 },
})

// ── Screen ────────────────────────────────────────────────────────────────────

export default function DocumentsScreen() {
  const documents = useAppStore((s) => s.documents)
  const addDocument = useAppStore((s) => s.addDocument)
  const deleteDocument = useAppStore((s) => s.deleteDocument)
  const timeline = useAppStore(selectTimeline)

  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null)

  function handleUpload() {
    setUploading(true)
    pickFile((doc) => { addDocument(doc); setUploading(false) })
    setTimeout(() => setUploading(false), 3000)
  }

  function handleDelete(id: string) {
    if (window.confirm('Remove this document?')) { deleteDocument(id); setPreviewDoc(null) }
  }

  const taskTitleMap: Record<string, string> = {}
  timeline.forEach((t) => { taskTitleMap[t.id] = t.title })

  // Filter by search
  const q = search.trim().toLowerCase()
  const filtered = q ? documents.filter((d) => d.name.toLowerCase().includes(q)) : documents
  const linked = filtered.filter((d) => d.taskId)
  const general = filtered.filter((d) => !d.taskId)
  const totalSize = documents.reduce((sum, d) => sum + d.size, 0)

  return (
    <View style={styles.container}>
      <PageBackground variant="face" size={300} opacity={0.28} style={{ bottom: 0, right: -60 }} />

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Your files</Text>
            <Text style={styles.title}>Documents</Text>
            <Text style={styles.sub}>
              {documents.length === 0
                ? 'Upload and store all your pet travel documents in one place.'
                : `${documents.length} file${documents.length !== 1 ? 's' : ''} · ${formatBytes(totalSize)} used`}
            </Text>
          </View>
        </View>

        {/* Upload button */}
        <TouchableOpacity style={styles.uploadBtn} onPress={handleUpload} activeOpacity={0.85}>
          <Text style={styles.uploadIcon}>↑</Text>
          <Text style={styles.uploadText}>{uploading ? 'Uploading…' : 'Upload documents'}</Text>
        </TouchableOpacity>
        <Text style={styles.uploadNote}>PDF, images, Word, Excel · Max 8 MB · Stored locally</Text>

        {/* Search */}
        {documents.length > 0 && (
          <View style={styles.searchRow}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search documents by name…"
              placeholderTextColor={colors.textMuted}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.searchClear}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Search empty */}
        {q && filtered.length === 0 && (
          <View style={styles.searchEmpty}>
            <Text style={styles.searchEmptyText}>No documents match "{search}"</Text>
          </View>
        )}

        {/* Empty state */}
        {documents.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📂</Text>
            <Text style={styles.emptyTitle}>No documents yet</Text>
            <Text style={styles.emptySub}>
              Upload health certificates, vaccination records, permits, invoices — everything in one place.
            </Text>
          </View>
        )}

        {/* Linked to tasks */}
        {linked.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Linked to tasks · {linked.length}</Text>
            {linked.map((doc) => (
              <DocRow
                key={doc.id}
                doc={doc}
                taskTitle={taskTitleMap[doc.taskId!]}
                onPress={() => setPreviewDoc(doc)}
              />
            ))}
          </View>
        )}

        {/* General */}
        {general.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>General · {general.length}</Text>
            {general.map((doc) => (
              <DocRow
                key={doc.id}
                doc={doc}
                onPress={() => setPreviewDoc(doc)}
              />
            ))}
          </View>
        )}

      </ScrollView>

      {/* Preview modal */}
      {previewDoc && (
        <PreviewModal
          doc={previewDoc}
          taskTitle={previewDoc.taskId ? taskTitleMap[previewDoc.taskId] : undefined}
          onClose={() => setPreviewDoc(null)}
          onDelete={() => handleDelete(previewDoc.id)}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, overflow: 'hidden' },
  scroll: { maxWidth: 900, width: '100%', alignSelf: 'center', padding: 24, paddingTop: 80, paddingBottom: 60 },

  header: { marginBottom: 20 },
  eyebrow: { fontSize: 11, fontWeight: '700', color: colors.gold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  sub: { fontSize: 13, color: colors.textMuted, marginTop: 4, lineHeight: 19 },

  uploadBtn: {
    backgroundColor: colors.btnPrimary, borderRadius: radius.lg,
    paddingVertical: 16, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 10, ...shadow.card,
  },
  uploadIcon: { fontSize: 18, color: colors.btnPrimaryText, fontWeight: '700' },
  uploadText: { color: colors.btnPrimaryText, fontSize: 16, fontWeight: '700' },
  uploadNote: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 8, marginBottom: 20 },

  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: 12,
    marginBottom: 24, gap: 8,
  },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: colors.text },
  searchClear: { fontSize: 13, color: colors.textMuted, padding: 4 },
  searchEmpty: { alignItems: 'center', paddingVertical: 32 },
  searchEmptyText: { fontSize: 14, color: colors.textMuted },

  section: { marginBottom: 24 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textSoft,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
  },

  emptyState: { alignItems: 'center', paddingTop: 40, paddingBottom: 32 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 },
  emptySub: { fontSize: 14, color: colors.textSoft, textAlign: 'center', lineHeight: 22, maxWidth: 300 },
})
