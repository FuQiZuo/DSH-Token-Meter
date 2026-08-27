/**
 * Disclaimer modal: centered overlay opened from the settings ⓘ button.
 * Registered into `shell.overlay` and lives until dismissed.
 * @module @deepseek-ai/dsh-client-ui-token-meter/client/disclaimer
 */

import { useEffect, useState } from 'react'
import type { TokenMeterLocaleKey } from './locales.ts'
import css from './panel.module.css'

export interface DisclaimerModalProps {
  visible: boolean
  onClose: () => void
  t: (key: TokenMeterLocaleKey) => string
  /** Subscribe to visibility changes (the modal re-renders on open/close). */
  subscribe: (listener: () => void) => () => void
}

export function DisclaimerModal(props: DisclaimerModalProps): React.ReactNode {
  const { visible, onClose, t, subscribe } = props
  const [open, setOpen] = useState(visible)
  useEffect(() => subscribe(() => setOpen(() => props.visible)), [subscribe, props.visible])
  if (!open) return null
  return (
    <div className={css.modalBg} onClick={onClose}>
      <div className={css.modal} onClick={(e) => e.stopPropagation()}>
        <span className={css.modalClose} onClick={onClose}>×</span>
        <div className={css.modalBody}>{t('disclaimer')}</div>
      </div>
    </div>
  )
}
