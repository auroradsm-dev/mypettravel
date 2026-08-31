import { create } from 'zustand'
import type { AppConfig, RuleSet, ScheduledTask } from '../types/rules'

export type TodoItem = {
  id: string
  text: string
  done: boolean
  createdAt: string  // ISO
}

export type DocumentItem = {
  id: string
  name: string          // filename
  mimeType: string      // e.g. 'application/pdf'
  size: number          // bytes
  dataUri: string       // base64 data URI
  taskId?: string       // optional task association
  uploadedAt: string    // ISO
}

export type CalendarEntry = {
  id: string
  title: string
  date: string          // ISO date (YYYY-MM-DD)
  note?: string
  createdAt: string     // ISO
}

// Shape synced to/from Supabase (documents excluded — too large)
export type SyncData = {
  onboarding: OnboardingData | null
  completions: Record<string, string | null>
  inProgress: Record<string, boolean>
  userNotes: Record<string, string>
  petPhoto: string | null
  todos: TodoItem[]
  appointmentDates: Record<string, string>
  calendarEntries: CalendarEntry[]
}
import { buildTimeline, getProgress, isOnTrack, getNextAction } from '../engine/timeline'
import { getAppConfig, getRuleSetId, loadRuleSet } from '../engine/configLoader'

// ── Persistence helpers (localStorage for web) ────────────────────────────────

function persist<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

function load<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type OnboardingData = {
  origin: string
  destination: string
  destinationCountry?: string
  petType: 'dog' | 'cat'
  petName: string
  travelDate: string   // ISO string
  airline?: string
  petSize?: 'cabin' | 'hold' | 'cargo'
}

type AppState = {
  // Onboarding
  onboarding: OnboardingData | null
  isOnboarded: boolean

  // Config
  appConfig: AppConfig
  ruleset: RuleSet | null

  // User progress
  completions: Record<string, string | null>  // taskId → ISO date string
  inProgress: Record<string, boolean>          // taskId → boolean

  // User notes per task
  userNotes: Record<string, string>            // taskId → free text

  // Authenticated user email (set on login, not persisted)
  userEmail: string | null

  // Pet photo (base64 data URI)
  petPhoto: string | null

  // Personal to-do list
  todos: TodoItem[]

  // Documents
  documents: DocumentItem[]

  // Appointment dates per task (taskId → ISO date string)
  appointmentDates: Record<string, string>

  // Manual calendar entries
  calendarEntries: CalendarEntry[]

  // Derived (rebuilt on demand)
  timeline: ScheduledTask[]
}

type AppActions = {
  completeOnboarding: (data: OnboardingData) => void
  resetOnboarding: () => void
  markTaskComplete: (taskId: string, date?: Date) => void
  markTaskIncomplete: (taskId: string) => void
  markTaskInProgress: (taskId: string) => void
  setTaskNote: (taskId: string, note: string) => void
  addTodo: (text: string) => void
  toggleTodo: (id: string) => void
  deleteTodo: (id: string) => void
  addDocument: (doc: Omit<DocumentItem, 'id' | 'uploadedAt'>) => void
  deleteDocument: (id: string) => void
  setAppointmentDate: (taskId: string, date: Date | null) => void
  addCalendarEntry: (title: string, date: string, note?: string) => void
  deleteCalendarEntry: (id: string) => void
  setUserEmail: (email: string | null) => void
  clearAllUserData: () => void
  hydrateFromRemote: (remote: SyncData) => void
  updateTravelDate: (date: Date) => void
  updatePetName: (name: string) => void
  setPetPhoto: (uri: string | null) => void
  rebuildTimeline: () => void
  updateRuleset: (rulesetId: string, ruleset: RuleSet) => void
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState & AppActions>((set, get) => {
  const savedOnboarding = load<OnboardingData>('onboarding')
  const savedCompletions = load<Record<string, string | null>>('completions') ?? {}
  const savedInProgress = load<Record<string, boolean>>('inProgress') ?? {}
  const savedUserNotes = load<Record<string, string>>('userNotes') ?? {}
  const savedPetPhoto = load<string | null>('petPhoto') ?? null
  const savedTodos = load<TodoItem[]>('todos') ?? []
  const savedDocuments = load<DocumentItem[]>('documents') ?? []
  const savedAppointmentDates = load<Record<string, string>>('appointmentDates') ?? {}
  const savedCalendarEntries = load<CalendarEntry[]>('calendarEntries') ?? []
  const appConfig = getAppConfig()

  let initialRuleset: RuleSet | null = null
  let initialTimeline: ScheduledTask[] = []

  if (savedOnboarding) {
    try {
      const rulesetId = getRuleSetId(
        savedOnboarding.origin,
        savedOnboarding.destination,
        savedOnboarding.petType,
        savedOnboarding.destinationCountry
      )
      initialRuleset = loadRuleSet(rulesetId)
      const completions = deserializeCompletions(savedCompletions)
      initialTimeline = buildTimeline(
        initialRuleset,
        appConfig,
        new Date(savedOnboarding.travelDate),
        new Date(),
        completions,
        { airline: savedOnboarding.airline, petSize: savedOnboarding.petSize },
        savedInProgress
      )
    } catch {
      // Corrupted state — will re-onboard
    }
  }

  return {
    // State
    onboarding: savedOnboarding,
    isOnboarded: !!savedOnboarding,
    appConfig,
    ruleset: initialRuleset,
    completions: savedCompletions,
    inProgress: savedInProgress,
    userNotes: savedUserNotes,
    userEmail: null,
    petPhoto: savedPetPhoto,
    todos: savedTodos,
    documents: savedDocuments,
    appointmentDates: savedAppointmentDates,
    calendarEntries: savedCalendarEntries,
    timeline: initialTimeline,

    // Actions
    completeOnboarding(data) {
      const rulesetId = getRuleSetId(
        data.origin,
        data.destination,
        data.petType,
        data.destinationCountry
      )
      const ruleset = loadRuleSet(rulesetId)
      const completions = deserializeCompletions(get().completions)
      const timeline = buildTimeline(
        ruleset,
        appConfig,
        new Date(data.travelDate),
        new Date(),
        completions,
        { airline: data.airline, petSize: data.petSize }
      )
      persist('onboarding', data)
      set({ onboarding: data, isOnboarded: true, ruleset, timeline })
    },

    resetOnboarding() {
      localStorage.removeItem('onboarding')
      localStorage.removeItem('completions')
      localStorage.removeItem('inProgress')
      localStorage.removeItem('userNotes')
      localStorage.removeItem('appointmentDates')
      set({
        onboarding: null,
        isOnboarded: false,
        ruleset: null,
        completions: {},
        inProgress: {},
        userNotes: {},
        appointmentDates: {},
        timeline: [],
        // keep todos, documents, petPhoto, calendarEntries across reset
      })
    },

    markTaskComplete(taskId, date = new Date()) {
      const completions = { ...get().completions, [taskId]: date.toISOString() }
      const inProgress = { ...get().inProgress, [taskId]: false }
      persist('completions', completions)
      persist('inProgress', inProgress)
      set({ completions, inProgress })
      get().rebuildTimeline()
    },

    markTaskIncomplete(taskId) {
      const completions = { ...get().completions, [taskId]: null }
      const inProgress = { ...get().inProgress, [taskId]: false }
      persist('completions', completions)
      persist('inProgress', inProgress)
      set({ completions, inProgress })
      get().rebuildTimeline()
    },

    markTaskInProgress(taskId) {
      const inProgress = { ...get().inProgress, [taskId]: true }
      persist('inProgress', inProgress)
      set({ inProgress })
      get().rebuildTimeline()   // ← fix: was missing, so timeline didn't update
    },

    setUserEmail(email) {
      set({ userEmail: email })
    },

    setTaskNote(taskId, note) {
      const userNotes = { ...get().userNotes, [taskId]: note }
      persist('userNotes', userNotes)
      set({ userNotes })
    },

    addTodo(text) {
      const todo: TodoItem = { id: Date.now().toString(), text, done: false, createdAt: new Date().toISOString() }
      const todos = [...get().todos, todo]
      persist('todos', todos)
      set({ todos })
    },

    toggleTodo(id) {
      const todos = get().todos.map((t) => t.id === id ? { ...t, done: !t.done } : t)
      persist('todos', todos)
      set({ todos })
    },

    deleteTodo(id) {
      const todos = get().todos.filter((t) => t.id !== id)
      persist('todos', todos)
      set({ todos })
    },

    addDocument(doc) {
      const item: DocumentItem = { ...doc, id: Date.now().toString(), uploadedAt: new Date().toISOString() }
      const documents = [...get().documents, item]
      persist('documents', documents)
      set({ documents })
    },

    deleteDocument(id) {
      const documents = get().documents.filter((d) => d.id !== id)
      persist('documents', documents)
      set({ documents })
    },

    setAppointmentDate(taskId, date) {
      const appointmentDates = { ...get().appointmentDates }
      if (date) {
        const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        appointmentDates[taskId] = iso
      } else {
        delete appointmentDates[taskId]
      }
      persist('appointmentDates', appointmentDates)
      set({ appointmentDates })
    },

    addCalendarEntry(title, date, note) {
      const entry: CalendarEntry = {
        id: Date.now().toString(),
        title,
        date,
        note,
        createdAt: new Date().toISOString(),
      }
      const calendarEntries = [...get().calendarEntries, entry]
      persist('calendarEntries', calendarEntries)
      set({ calendarEntries })
    },

    deleteCalendarEntry(id) {
      const calendarEntries = get().calendarEntries.filter((e) => e.id !== id)
      persist('calendarEntries', calendarEntries)
      set({ calendarEntries })
    },

    clearAllUserData() {
      const keys = [
        'onboarding', 'completions', 'inProgress', 'userNotes',
        'appointmentDates', 'calendarEntries', 'todos', 'documents', 'petPhoto',
      ]
      keys.forEach((k) => localStorage.removeItem(k))
      set({
        onboarding: null, isOnboarded: false, ruleset: null, timeline: [],
        completions: {}, inProgress: {}, userNotes: {},
        appointmentDates: {}, calendarEntries: [],
        todos: [], documents: [], petPhoto: null,
      })
    },

    hydrateFromRemote(remote: SyncData) {
      const { appConfig } = get()

      // Write to localStorage so it works offline too
      if (remote.onboarding) persist('onboarding', remote.onboarding)
      else localStorage.removeItem('onboarding')
      persist('completions', remote.completions ?? {})
      persist('inProgress', remote.inProgress ?? {})
      persist('userNotes', remote.userNotes ?? {})
      try {
        if (remote.petPhoto) localStorage.setItem('petPhoto', JSON.stringify(remote.petPhoto))
        else localStorage.removeItem('petPhoto')
      } catch {}
      persist('todos', remote.todos ?? [])
      persist('appointmentDates', remote.appointmentDates ?? {})
      persist('calendarEntries', remote.calendarEntries ?? [])

      // Rebuild timeline from remote onboarding
      let ruleset: RuleSet | null = null
      let timeline: ScheduledTask[] = []
      const completions = remote.completions ?? {}
      const inProgress = remote.inProgress ?? {}

      if (remote.onboarding) {
        try {
          const rulesetId = getRuleSetId(
            remote.onboarding.origin,
            remote.onboarding.destination,
            remote.onboarding.petType,
            remote.onboarding.destinationCountry
          )
          ruleset = loadRuleSet(rulesetId)
          timeline = buildTimeline(
            ruleset, appConfig,
            new Date(remote.onboarding.travelDate), new Date(),
            deserializeCompletions(completions),
            { airline: remote.onboarding.airline, petSize: remote.onboarding.petSize },
            inProgress
          )
        } catch {}
      }

      set({
        onboarding: remote.onboarding,
        isOnboarded: !!remote.onboarding,
        ruleset, timeline,
        completions, inProgress,
        userNotes: remote.userNotes ?? {},
        petPhoto: remote.petPhoto ?? null,
        todos: remote.todos ?? [],
        appointmentDates: remote.appointmentDates ?? {},
        calendarEntries: remote.calendarEntries ?? [],
      })
    },

    updateTravelDate(date) {
      const { onboarding } = get()
      if (!onboarding) return
      const updated = { ...onboarding, travelDate: date.toISOString() }
      persist('onboarding', updated)
      set({ onboarding: updated })
      get().rebuildTimeline()
    },

    updatePetName(name) {
      const { onboarding } = get()
      if (!onboarding) return
      const updated = { ...onboarding, petName: name }
      persist('onboarding', updated)
      set({ onboarding: updated })
    },

    setPetPhoto(uri) {
      try {
        if (uri) localStorage.setItem('petPhoto', JSON.stringify(uri))
        else localStorage.removeItem('petPhoto')
      } catch {}
      set({ petPhoto: uri })
    },

    rebuildTimeline() {
      const { ruleset, appConfig, onboarding, completions, inProgress } = get()
      if (!ruleset || !onboarding) return
      const timeline = buildTimeline(
        ruleset,
        appConfig,
        new Date(onboarding.travelDate),
        new Date(),
        deserializeCompletions(completions),
        { airline: onboarding.airline, petSize: onboarding.petSize },
        inProgress
      )
      set({ timeline })
    },

    updateRuleset(rulesetId, ruleset) {
      const { onboarding } = get()
      const currentId = onboarding
        ? getRuleSetId(
            onboarding.origin,
            onboarding.destination,
            onboarding.petType,
            onboarding.destinationCountry
          )
        : null
      if (currentId === rulesetId) {
        set({ ruleset })
        get().rebuildTimeline()
      }
    },
  }
})

// ── Selectors ─────────────────────────────────────────────────────────────────

export const selectTimeline = (s: AppState) => s.timeline
export const selectOnboarding = (s: AppState) => s.onboarding
export const selectProgressDone = (s: AppState) => getProgress(s.timeline).done
export const selectProgressTotal = (s: AppState) => getProgress(s.timeline).total
export const selectIsOnTrack = (s: AppState) => isOnTrack(s.timeline)
export const selectNextAction = (s: AppState) => getNextAction(s.timeline)
export const selectAppConfig = (s: AppState) => s.appConfig
export const selectUserNotes = (s: AppState) => s.userNotes
export const selectPetPhoto = (s: AppState) => s.petPhoto
export const selectAppointmentDates = (s: AppState) => s.appointmentDates
export const selectCalendarEntries = (s: AppState) => s.calendarEntries

export function extractSyncData(s: AppState): SyncData {
  return {
    onboarding: s.onboarding,
    completions: s.completions,
    inProgress: s.inProgress,
    userNotes: s.userNotes,
    petPhoto: s.petPhoto,
    todos: s.todos,
    appointmentDates: s.appointmentDates,
    calendarEntries: s.calendarEntries,
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function deserializeCompletions(
  raw: Record<string, string | null>
): Record<string, Date | null> {
  return Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, v ? new Date(v) : null])
  )
}
