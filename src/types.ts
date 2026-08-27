/**
 * Client-local contract types for the Token Meter.
 * @module @deepseek-ai/dsh-client-ui-token-meter/types
 */

/** The DSH authoritative token-usage projection (disjoint buckets). */
export interface TokenUsageProjection {
  uncachedInputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheWriteTokens: number
}

/** Statistics mode: live (local estimate during generation) or deferred (real on step end). */
export type MeterMode = 'live' | 'dc'

/** UI language. */
export type MeterLang = 'zh' | 'en'

/** Text size. */
export type MeterTextSize = 'small' | 'medium' | 'large'

/** Persisted settings for the Token Meter. */
export interface TokenMeterSettings {
  mode: MeterMode
  lang: MeterLang
  /** 0-100 panel transparency (100 = fully clear). */
  transparent: number
  textSize: MeterTextSize
}

/** The defaults every field falls back to. */
export const DEFAULT_SETTINGS: TokenMeterSettings = {
  mode: 'live',
  lang: 'zh',
  transparent: 60,
  textSize: 'medium',
}
