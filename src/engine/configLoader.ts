import type { AppConfig, Manifest, RuleSet } from '../types/rules'
import { mergeRuleSets } from './timeline'

// Bundled assets — always available offline
const bundledAppConfig: AppConfig = require('../../config/app.config.json')
const bundledManifest: Manifest = require('../../config/rules/manifest.json')

const bundledRulesets: Record<string, RuleSet> = {
  'ZA-EU-dog': require('../../config/rules/ZA-EU-dog.json'),
  'ZA-EU-FI-dog': require('../../config/rules/ZA-EU-FI-dog.json'),
  'ZA-EU-MT-dog': require('../../config/rules/ZA-EU-MT-dog.json'),
}

// ── App config ────────────────────────────────────────────────────────────────

export function getAppConfig(): AppConfig {
  return bundledAppConfig
}

// ── Ruleset loading ───────────────────────────────────────────────────────────

export function getRuleSetId(
  origin: string,
  destination: string,
  petType: string,
  destinationCountry?: string
): string {
  if (destinationCountry) {
    const specific = `${origin}-${destination}-${destinationCountry}-${petType}`
    if (bundledRulesets[specific]) return specific
  }
  return `${origin}-${destination}-${petType}`
}

export function loadRuleSet(rulesetId: string): RuleSet {
  const ruleset = bundledRulesets[rulesetId]
  if (!ruleset) throw new Error(`Ruleset not found: ${rulesetId}`)

  // If this ruleset extends a base, merge them
  if (ruleset.extendsRuleset) {
    const base = bundledRulesets[ruleset.extendsRuleset]
    if (!base) throw new Error(`Base ruleset not found: ${ruleset.extendsRuleset}`)
    return mergeRuleSets(base, ruleset)
  }

  return ruleset
}

export function getManifest(): Manifest {
  return bundledManifest
}

// ── Remote update (OTA) ───────────────────────────────────────────────────────
// Fetches the remote manifest and downloads updated rulesets if versions differ.
// Silently falls back to bundled if network unavailable.
// Results are stored in MMKV and used on next app load.

export async function fetchRemoteUpdates(
  manifestUrl: string,
  timeoutMs: number,
  onUpdate: (rulesetId: string, ruleset: RuleSet) => void
): Promise<void> {
  if (!manifestUrl) return

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    const res = await fetch(manifestUrl, { signal: controller.signal })
    clearTimeout(timeout)

    if (!res.ok) return

    const remoteManifest: Manifest = await res.json()

    for (const entry of remoteManifest.rulesets) {
      const local = bundledManifest.rulesets.find((r) => r.id === entry.id)
      if (local && local.version === entry.version) continue

      // Newer version available — fetch updated ruleset
      const baseUrl = manifestUrl.substring(0, manifestUrl.lastIndexOf('/'))
      const rulesetRes = await fetch(`${baseUrl}/${entry.file}`)
      if (!rulesetRes.ok) continue

      const ruleset: RuleSet = await rulesetRes.json()
      onUpdate(entry.id, ruleset)
    }
  } catch {
    // Network unavailable or timeout — bundled version remains in use
  }
}
