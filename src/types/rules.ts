export type PetType = 'dog' | 'cat'

export type TaskCategory = 'vaccination' | 'health_cert' | 'permit' | 'crate' | 'airline' | 'admin' | 'travel_day'

export type TaskType = 'action' | 'milestone'

export type TimingConstraint =
  | { type: 'anytime' }
  | {
      type: 'before_travel'
      maxDaysBefore: number
      minDaysBefore?: number
    }
  | {
      type: 'after_task'
      taskId: string
      minDays: number
      maxDays?: number
      typicalDays?: number
      note?: string
    }
  | {
      type: 'before_task'
      taskId: string
      minDays: number
    }

export type TaskConditions = {
  airline?: string[]
  petSize?: Array<'cabin' | 'hold' | 'cargo'>
}

export type Task = {
  id: string
  type: TaskType
  title: string
  description: string
  why: string
  category: TaskCategory
  documents: string[]
  timing: TimingConstraint
  dependsOn: string[]
  required: boolean
  notes?: string
  conditions?: TaskConditions
  failureInstruction?: string
}

export type MinimumLeadTimeWarning = {
  days: number
  message: string
}

export type RuleSet = {
  id: string
  origin: string
  destination: string
  destinationCountry?: string
  petType: PetType
  schemaVersion: string
  version: string
  lastVerified: string
  officialSource: string
  regulationReference: string
  notes: string
  minimumLeadTimeWarning?: MinimumLeadTimeWarning
  tasks: Task[]
  extendsRuleset?: string
  overrideTasks?: Task[]
  additionalTasks?: Task[]
}

// ── Timeline engine output ────────────────────────────────────────────────────

export type TaskStatus =
  | 'completed'
  | 'in_progress'
  | 'overdue'
  | 'due_soon'
  | 'in_window'
  | 'upcoming'
  | 'blocked'
  | 'milestone_reached'
  | 'milestone_pending'

export type ScheduledTask = Task & {
  windowStart: Date | null   // earliest date the task can be done
  windowEnd: Date | null     // latest date (hard deadline)
  status: TaskStatus
  blockedBy: string[]        // task IDs blocking this one
  completedAt: Date | null
}

// ── App config ────────────────────────────────────────────────────────────────

export type AppConfig = {
  schemaVersion: string
  timeline: {
    dueSoonThresholdDays: number
    overdueGraceDays: number
    monthsApproximateDays: number
  }
  notifications: {
    reminderDaysBefore: number[]
  }
  supportedRoutes: {
    origins: string[]
    destinations: string[]
    petTypes: PetType[]
    euCountries: Array<{ code: string; name: string; hasOverride?: boolean }>
  }
  statusLabels: Record<TaskStatus, string>
  statusColors: Record<TaskStatus, string>
  categoryLabels: Record<TaskCategory, string>
  categoryOrder: TaskCategory[]
  remoteConfig: {
    manifestUrl: string
    fetchTimeoutMs: number
    cacheMaxAgeHours: number
  }
}

// ── Manifest ──────────────────────────────────────────────────────────────────

export type ManifestEntry = {
  id: string
  file: string
  version: string
  origin: string
  destination: string
  destinationCountry?: string
  petType: PetType
  lastVerified: string
  description: string
  extendsRuleset?: string
}

export type Manifest = {
  schemaVersion: string
  lastUpdated: string
  rulesets: ManifestEntry[]
}
