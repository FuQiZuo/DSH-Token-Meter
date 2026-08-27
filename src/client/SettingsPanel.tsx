/**
 * Token Meter settings section: statistics mode, language, transparency
 * slider, and text size, plus the disclaimer link.
 * @module @deepseek-ai/dsh-client-ui-token-meter/client/settings
 */

import { useEffect, useState } from 'react'
import type { TokenMeterSettings } from '../types.ts'
import type { TokenMeterLocaleKey } from './locales.ts'
import css from './panel.module.css'

/** Injected face: the settings store + translate + disclaimer opener. */
export interface SettingsPanelInjected {
  store: {
    get: () => TokenMeterSettings
    set: <K extends keyof TokenMeterSettings>(key: K, value: TokenMeterSettings[K]) => void
    subscribe: (fn: () => void) => () => void
  }
  t: (key: TokenMeterLocaleKey) => string
  openDisclaimer: () => void
}

export type SettingsPanelProps = SettingsPanelInjected

function useStore(injected: SettingsPanelInjected): TokenMeterSettings {
  const [, force] = useState(0)
  useEffect(() => injected.store.subscribe(() => force(n => n + 1)), [injected.store])
  return injected.store.get()
}

/** Two/three-state option rendered as a pill of tappable blocks. */
function Blocks<T extends string>(options: readonly { value: T; label: string }[], value: T, onChange: (v: T) => void): React.ReactNode {
  return (
    <div className={css.seg}>
      {options.map((option) => {
        const active = option.value === value
        return (
          <button key={option.value} type="button"
            className={css.segBtn + (active ? ` ${css.segActive}` : '')}
            onClick={() => onChange(option.value)}>{option.label}</button>
        )
      })}
    </div>
  )
}

export function SettingsPanel(props: SettingsPanelProps): React.ReactNode {
  const { store, t, openDisclaimer } = props
  const settings = useStore(props)
  const set = (key: keyof TokenMeterSettings, value: TokenMeterSettings[keyof TokenMeterSettings]): void => { store.set(key, value) }

  return (
    <div className={css.settings}>
      <div className={css.setTitle}>{t('settingsTitle')}</div>

      <div className={css.setBlock}>
        <div className={css.setGroupTitle}>{t('mode')}</div>
        {Blocks<TokenMeterSettings['mode']>(
          [{ value: 'live', label: t('live') }, { value: 'dc', label: t('dc') }],
          settings.mode, v => set('mode', v))}
      </div>
      <div className={css.divider} />

      <div className={css.setBlock}>
        <div className={css.setGroupTitle}>{t('lang')}</div>
        {Blocks<TokenMeterSettings['lang']>(
          [{ value: 'zh', label: t('zh') }, { value: 'en', label: t('en') }],
          settings.lang, v => set('lang', v))}
      </div>
      <div className={css.divider} />

      <div className={css.setBlock}>
        <div className={css.setGroupTitle}>{t('transparent')}</div>
        <div className={css.slider}>
          <span className={css.sliderLabel}>0%</span>
          <input type="range" min={0} max={100} step={1} value={settings.transparent}
            onChange={(e) => set('transparent', Number(e.target.value))} />
          <span className={css.sliderLabel}>100%</span>
        </div>
        <div className={css.sliderValue}>{settings.transparent}%</div>
      </div>
      <div className={css.divider} />

      <div className={css.setBlock}>
        <div className={css.setGroupTitle}>{t('textSize')}</div>
        {Blocks<TokenMeterSettings['textSize']>(
          [{ value: 'small', label: t('small') }, { value: 'medium', label: t('medium') }, { value: 'large', label: t('large') }],
          settings.textSize, v => set('textSize', v))}
      </div>
      <div className={css.divider} />

      <div className={css.setBlock}>
        <div className={css.setGroupTitle}>
          <button type="button" className={css.info} onClick={openDisclaimer} aria-label={t('disclaimerTitle')}>ⓘ</button>
          {t('disclaimerTitle')}
        </div>
      </div>
    </div>
  )
}
