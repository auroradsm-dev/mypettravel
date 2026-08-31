import type {
  AppConfig,
  RuleSet,
  ScheduledTask,
  Task,
  TaskStatus,
  TimingConstraint,
} from '../types/rules'

// ── Date helpers ──────────────────────────────────────────────────────────────

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

// ── Resolve absolute window dates for a single task ───────────────────────────

function resolveWindow(
  timing: TimingConstraint,
  travelDate: Date,
  completions: Record<string, Date | null>
): { windowStart: Date | null; windowEnd: Date | null } {
  switch (timing.type) {
    case 'anytime':
      return { windowStart: null, windowEnd: null }

    case 'before_travel':
      return {
        windowStart: timing.minDaysBefore != null
          ? addDays(travelDate, -timing.maxDaysBefore)
          : null,
        windowEnd: addDays(travelDate, -timing.maxDaysBefore),
      }

    case 'after_task': {
      const anchorDate = completions[timing.taskId]
      if (!anchorDate) return { windowStart: null, windowEnd: null }
      return {
        windowStart: addDays(anchorDate, timing.minDays),
        windowEnd: timing.maxDays != null
          ? addDays(anchorDate, timing.maxDays)
          : null,
      }
    }

    case 'before_task': {
      const anchorDate = completions[timing.taskId]
      if (!anchorDate) return { windowStart: null, windowEnd: null }
      return {
        windowStart: null,
        windowEnd: addDays(anchorDate, -timing.minDays),
      }
    }
  }
}

// ── Topological sort of task DAG ──────────────────────────────────────────────

function topoSort(tasks: Task[]): Task[] {
  const taskMap = new Map(tasks.map((t) => [t.id, t]))
  const visited = new Set<string>()
  const result: Task[] = []

  function visit(id: string, ancestors: Set<string>) {
    if (ancestors.has(id)) throw new Error(`Circular dependency detected: ${id}`)
    if (visited.has(id)) return
    const task = taskMap.get(id)
    if (!task) return
    ancestors.add(id)
    for (const dep of task.dependsOn) visit(dep, new Set(ancestors))
    visited.add(id)
    result.push(task)
  }

  for (const task of tasks) visit(task.id, new Set())
  return result
}

// ── Merge base ruleset with an override ───────────────────────────────────────

export function mergeRuleSets(base: RuleSet, override: RuleSet): RuleSet {
  const taskMap = new Map(base.tasks.map((t) => [t.id, t]))

  // Apply overrides to existing tasks
  for (const task of override.overrideTasks ?? []) {
    taskMap.set(task.id, task)
  }

  // Append additional tasks
  for (const task of override.additionalTasks ?? []) {
    taskMap.set(task.id, task)
  }

  return {
    ...base,
    ...override,
    tasks: Array.from(taskMap.values()),
    overrideTasks: undefined,
    additionalTasks: undefined,
  }
}

// ── Filter tasks by user conditions ──────────────────────────────────────────

function filterByConditions(
  tasks: Task[],
  conditions: { airline?: string; petSize?: string }
): Task[] {
  return tasks.filter((task) => {
    if (!task.conditions) return true
    if (
      task.conditions.airline &&
      conditions.airline &&
      !task.conditions.airline.includes(conditions.airline)
    ) {
      return false
    }
    if (
      task.conditions.petSize &&
      conditions.petSize &&
      !task.conditions.petSize.includes(conditions.petSize as 'cabin' | 'hold' | 'cargo')
    ) {
      return false
    }
    return true
  })
}

// ── Assign status to a scheduled task ─────────────────────────────────────────

function assignStatus(
  task: Task,
  windowStart: Date | null,
  windowEnd: Date | null,
  today: Date,
  travelDate: Date,
  completedAt: Date | null,
  blockedBy: string[],
  dueSoonThresholdDays: number
): TaskStatus {
  if (completedAt) {
    return task.type === 'milestone' ? 'milestone_reached' : 'completed'
  }

  // Milestones auto-resolve based on date
  if (task.type === 'milestone') {
    if (windowStart && today >= windowStart) return 'milestone_reached'
    return 'milestone_pending'
  }

  if (blockedBy.length > 0) return 'blocked'

  const deadline = windowEnd ?? travelDate

  if (today > deadline) return 'overdue'

  if (daysBetween(today, deadline) <= dueSoonThresholdDays) return 'due_soon'

  if (windowStart && today < windowStart) return 'upcoming'

  return 'in_window'
}

// ── Main engine function ───────────────────────────────────────────────────────

export function buildTimeline(
  ruleset: RuleSet,
  appConfig: AppConfig,
  travelDate: Date,
  today: Date,
  completions: Record<string, Date | null>,
  userConditions: { airline?: string; petSize?: string } = {},
  inProgress: Record<string, boolean> = {}
): ScheduledTask[] {
  const { dueSoonThresholdDays } = appConfig.timeline

  // Filter tasks by conditions (airline, pet size)
  const applicableTasks = filterByConditions(ruleset.tasks, userConditions)

  // Topological sort to determine dependency order
  const sortedTasks = topoSort(applicableTasks)

  // Build a set of completed task IDs (milestones auto-complete by date)
  const effectiveCompletions: Record<string, Date | null> = { ...completions }

  // First pass: auto-resolve milestones based on dates
  for (const task of sortedTasks) {
    if (task.type !== 'milestone') continue
    const { windowStart } = resolveWindow(task.timing, travelDate, effectiveCompletions)
    if (windowStart && today >= windowStart && !effectiveCompletions[task.id]) {
      effectiveCompletions[task.id] = windowStart
    }
  }

  // Second pass: build scheduled tasks
  const scheduled: ScheduledTask[] = []

  for (const task of sortedTasks) {
    const { windowStart, windowEnd } = resolveWindow(
      task.timing,
      travelDate,
      effectiveCompletions
    )

    const completedAt = effectiveCompletions[task.id] ?? null

    const blockedBy = task.dependsOn.filter((depId) => !effectiveCompletions[depId])

    let status = assignStatus(
      task,
      windowStart,
      windowEnd,
      today,
      travelDate,
      completedAt,
      blockedBy,
      dueSoonThresholdDays
    )

    // Override with in_progress if user marked it so (and not already completed)
    if (inProgress[task.id] && status !== 'completed' && status !== 'milestone_reached') {
      status = 'in_progress'
    }

    scheduled.push({
      ...task,
      windowStart,
      windowEnd,
      status,
      blockedBy,
      completedAt,
    })
  }

  return scheduled
}

// ── Derived queries ───────────────────────────────────────────────────────────

export function getNextAction(tasks: ScheduledTask[]): ScheduledTask | null {
  return (
    tasks.find((t) => t.status === 'due_soon') ??
    tasks.find((t) => t.status === 'in_window') ??
    tasks.find((t) => t.status === 'overdue') ??
    null
  )
}

export function isOnTrack(tasks: ScheduledTask[]): boolean {
  return !tasks.some((t) => t.status === 'overdue')
}

export function getMinimumStartDate(ruleset: RuleSet, appConfig: AppConfig): number {
  return ruleset.minimumLeadTimeWarning?.days ?? appConfig.timeline.monthsApproximateDays * 5
}

export function getProgress(tasks: ScheduledTask[]): { done: number; total: number } {
  const actionTasks = tasks.filter((t) => t.type === 'action' && t.required)
  const done = actionTasks.filter(
    (t) => t.status === 'completed'
  ).length
  return { done, total: actionTasks.length }
}
