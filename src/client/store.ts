/**
 * Client-side settings store for the Token Meter. Persists through localStorage
 * so preferences survive a reload; the host also registers the same namespace
 * so the section is discoverable, but this binding is browser-local and never
 * blocks rendering.
 * @module @deepseek-ai/dsh-client-ui-token-meter/client/store
 */

import { DEFAULT_SETTINGS, type TokenMeterSettings } from '../types.ts'

/** A shared mutable flag with a listener set (used for the disclaimer modal). */
export interface ReactiveFlag {
  visible: boolean
  listeners: Set<() => void>
}

/** localStorage key used when no namespace scope is available. */
const FALLBACK_KEY = 'dsh.token-meter.settings'

/** Merge a raw (possibly partial/unknown) section into a complete settings object. */
export function normalizeSettings(raw: unknown): TokenMeterSettings {
  if (raw === null || typeof raw !== 'object') return { ...DEFAULT_SETTINGS }
  const rec = raw as Record<string, unknown>
  const transparent = typeof rec.transparent === 'number'
    && Number.isFinite(rec.transparent)
    ? Math.min(100, Math.max(0, Math.round(rec.transparent)))
    : DEFAULT_SETTINGS.transparent
  return {
    mode: rec.mode === 'dc' ? 'dc' : 'live',
    lang: rec.lang === 'en' ? 'en' : 'zh',
    transparent,
    textSize: rec.textSize === 'small' || rec.textSize === 'large' ? rec.textSize : 'medium',
  }
}

/** Owning store for the plugin settings, backed by localStorage. */
export class SettingsStore {
  private value: TokenMeterSettings
  private readonly listeners = new Set<() => void>()

  constructor() {
    this.value = this.read()
  }

  /** Current value (stable reference until the next write). */
  get(): TokenMeterSettings {
    return this.value
  }

  /** Write one field and persist. */
  set<K extends keyof TokenMeterSettings>(key: K, value: TokenMeterSettings[K]): void {
    this.value = normalizeSettings({ ...this.value, [key]: value })
    this.emit()
    try {
      localStorage.setItem(FALLBACK_KEY, JSON.stringify(this.value))
    } catch {
      // Storage may be unavailable (private mode / quota); in-memory is still correct.
    }
  }

  /** Subscribe to value changes (returns a disposer). */
  subscribe(fn: () => void): () => void {
    this.listeners.add(fn)
    return () => { this.listeners.delete(fn) }
  }

  private read(): TokenMeterSettings {
    try {
      const raw = localStorage.getItem(FALLBACK_KEY)
      if (raw === null) return { ...DEFAULT_SETTINGS }
      return normalizeSettings(JSON.parse(raw))
    } catch {
      return { ...DEFAULT_SETTINGS }
    }
  }

  private emit(): void {
    for (const fn of [...this.listeners]) {
      try { fn() } catch { /* subscriber crashed */ }
    }
  }
}
