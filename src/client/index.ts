/**
 * DSH Token Meter — CLIENT half entry.
 *
 * Registers:
 *   - `shell.overlay` → the bottom-right floating panel (root scope; reads
 *     the authoritative `tokenUsage` projection via `useSessions` and the
 *     current session's streaming `partial` for the live in-flight estimate).
 *   - `shell.overlay` → the centered disclaimer modal.
 *   - `settings.section` → the plugin settings page.
 *
 * Settings persist through a browser-local store. The live estimate is computed
 * entirely client-side by tokenizing the current session's streaming partial;
 * no host Remote is required.
 *
 * @module @deepseek-ai/dsh-client-ui-token-meter/client
 */

import type { AssistantBlock, ClientContext, SessionId } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls the ui-slots SlotMap keys (shell.overlay).
import type {} from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: pulls the ui-layout SlotMap merge (shell.overlay declaration).
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
// Type-only: pulls the ui-settings SlotMap merge (settings.section declaration).
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'
import { MeterPanel, type MeterPanelInjected } from './MeterPanel.tsx'
import { SettingsPanel, type SettingsPanelInjected } from './SettingsPanel.tsx'
import { DisclaimerModal, type DisclaimerModalProps } from './DisclaimerModal.tsx'
import { SettingsStore, type ReactiveFlag } from './store.ts'
import { en, zh, NS, type TokenMeterLocaleKey } from './locales.ts'

export type { MeterPanelInjected, MeterPanelProps } from './MeterPanel.tsx'
export type { SettingsPanelInjected, SettingsPanelProps } from './SettingsPanel.tsx'
export type { DisclaimerModalProps } from './DisclaimerModal.tsx'
export type { TokenMeterLocaleKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Token Meter panel + settings copy. */
    'token-meter': TokenMeterLocaleKey
  }
}

/** Dictionary namespace owned by this plugin. */
const LOCALE_NS = NS

/** Build a store-driven translator: reads the active `lang` setting per call. */
function makeT(getLang: () => unknown): (key: TokenMeterLocaleKey) => string {
  return (key) => {
    const lang = getLang() === 'en' ? en : zh
    return lang[key] ?? zh[key] ?? key
  }
}

/** Required services: slot + locale registration and the session reader. */
export const inject = ['slots', 'locale', 'sessions']

/**
 * Client plugin body: register the panel, disclaimer modal, settings page, and
 * the dictionaries.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(LOCALE_NS, { zh, en }), 'token-meter: dictionaries')

  const store = new SettingsStore()
  // Translator follows the plugin's own `lang` setting (not the global locale),
  // so switching language re-renders every component through the shared store.
  const t = makeT(() => store.get().lang)

  // Reactive disclaimer flag shared across the settings ⓘ button and the modal.
  const disclaimer: ReactiveFlag = { visible: false, listeners: new Set() }
  const openDisclaimer = (): void => { disclaimer.visible = true; for (const fn of [...disclaimer.listeners]) fn() }
  const closeDisclaimer = (): void => { disclaimer.visible = false; for (const fn of [...disclaimer.listeners]) fn() }

  // Read the current session's streaming assistant partial blocks (null when no
  // step is generating). This is the client-side source of the live estimate,
  // so the panel needs no host round-trip to rise during generation.
  const sessions = ctx.sessions
  const readPartial = (sessionId: string): readonly AssistantBlock[] | null => {
    const binding = sessions.binding(sessionId as SessionId)
    if (binding === undefined) return null
    const partial = binding.session.getSnapshot().partial
    return partial === null ? null : partial.blocks
  }

  const panelInjected = (): MeterPanelInjected => ({ store, readPartial, t })
  const settingsInjected = (): SettingsPanelInjected => ({ store, t, openDisclaimer })

  ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name: 'shell.overlay',
    id: 'token-meter-panel',
    order: 10,
    locale: LOCALE_NS,
    inject: panelInjected,
  }, MeterPanel))

  // Disclaimer modal reacts to the shared flag, so either opener reaches it.
  ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name: 'shell.overlay',
    id: 'token-meter-disclaimer',
    order: 11,
    locale: LOCALE_NS,
    inject: (): DisclaimerModalProps => ({
      visible: disclaimer.visible,
      onClose: closeDisclaimer,
      t,
      subscribe: (fn) => { disclaimer.listeners.add(fn); return () => { disclaimer.listeners.delete(fn) } },
    }),
  }, DisclaimerModal))

  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'token-meter',
    order: 40,
    locale: LOCALE_NS,
    label: () => t('settingsTitle'),
    inject: settingsInjected,
  }, SettingsPanel))
}
