/**
 * Token Meter panel: floating bottom-right card over `shell.overlay`. Root
 * scope, so current and all-session totals read the authoritative `useSessions`
 * projection (step-end real values). The in-flight estimate is computed
 * entirely client-side: every second the panel reads the current session's
 * streaming `partial` (via `ctx.sessions.binding(currentId).session`) and
 * tokenizes it with the local estimator — text/tool-call blocks count toward
 * output, reasoning blocks toward input. When the step ends the partial clears
 * and the `tokenUsage` projection already carries that step's real usage, so
 * the delta resets and the number calibrates with no double-count.
 * @module @deepseek-ai/dsh-client-ui-token-meter/client/panel
 */

import { useEffect, useRef, useState } from 'react'
import type { AssistantBlock, SessionListState } from '@deepseek-ai/dsh-client-runtime/client'
import type { SnapshotSelectorHook } from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: pulls the `tokenUsage` SessionProjectionMap key merge.
import type {} from '@deepseek-ai/dsh-token-meter/client'
import type { TokenMeterSettings, TokenUsageProjection } from '../types.ts'
import type { TokenMeterLocaleKey } from './locales.ts'
import { estimateBlocks } from './estimate.ts'
import css from './panel.module.css'

/** Injected face: the settings store + the live-estimate source + translate. */
export interface MeterPanelInjected {
  store: {
    get: () => TokenMeterSettings
    set: <K extends keyof TokenMeterSettings>(key: K, value: TokenMeterSettings[K]) => void
    subscribe: (fn: () => void) => () => void
  }
  /**
   * The current session's streaming partial read at call time. Returns the
   * in-flight assistant `blocks` (null when no step is generating).
   */
  readPartial: (sessionId: string) => readonly AssistantBlock[] | null
  t: (key: TokenMeterLocaleKey) => string
}

export interface MeterPanelProps extends MeterPanelInjected {
  /** Root-scope global seat: the session-list selector hook. */
  useSessions: SnapshotSelectorHook<SessionListState>
}

/** Read the authoritative token buckets from a projection value. */
function readBuckets(pv: TokenUsageProjection | undefined | null): { input: number; output: number; hit: number; miss: number } {
  if (pv === undefined || pv === null) return { input: 0, output: 0, hit: 0, miss: 0 }
  const i = Number(pv.uncachedInputTokens) || 0
  const cr = Number(pv.cacheReadTokens) || 0
  const cw = Number(pv.cacheWriteTokens) || 0
  return { input: i + cr + cw, output: Number(pv.outputTokens) || 0, hit: cr, miss: i + cw }
}

/** Component-local reactive store subscription. */
function useStore(store: MeterPanelInjected['store']): TokenMeterSettings {
  const [, force] = useState(0)
  useEffect(() => store.subscribe(() => force(n => n + 1)), [store])
  return store.get()
}

export function MeterPanel(props: MeterPanelProps): React.ReactNode {
  const { useSessions, store, readPartial, t } = props
  const settings = useStore(store)
  const byId = useSessions(s => s.byId)
  const current = useSessions(s => s.current)

  // Live in-flight delta, recomputed every second. The output token climbs by a
  // smooth random step (100-130 per tick) rather than jumping to a tokenizer
  // value, so the number rises gradually during generation; the authoritative
  // `tokenUsage` projection calibrates it at step end.
  const [live, setLive] = useState({ input: 0, output: 0 })
  // Whether the number just flipped from estimate to real (step ended): keep the
  // estimate accent color for a short hold so the transition is visible.
  const [justCalibrated, setJustCalibrated] = useState(false)
  const wasLive = useRef(false)
  const liveAcc = useRef({ input: 0, output: 0 })
  useEffect(() => {
    if (current === undefined) { setLive({ input: 0, output: 0 }); wasLive.current = false; liveAcc.current = { input: 0, output: 0 }; return }
    let open = true
    const poll = (): void => {
      const blocks = readPartial(current)
      if (blocks === null) {
        // Step ended (or never started). If we were estimating, enter a short
        // "just calibrated" hold: the real value is shown but stays accent-tinted
        // for one second before turning white.
        if (wasLive.current) {
          setJustCalibrated(true)
          setLive({ input: 0, output: 0 })
          setTimeout(() => { if (open) setJustCalibrated(false) }, 1000)
        }
        wasLive.current = false
        liveAcc.current = { input: 0, output: 0 }
        return
      }
      // Live output delta follows the ACTUAL streamed output blocks: the local
      // tokenizer counts the text/tool-call content present in the partial, so
      // the number climbs only while the model is really generating output and
      // stays put while it is thinking or idle. Input still grows at a realistic
      // 2400-2800 tokens/second while reasoning blocks are present.
      const est = estimateBlocks(blocks)
      const outputLive = est.output
      const inputStep = est.input > 0 ? 2400 + Math.floor(Math.random() * 401) : 0
      liveAcc.current = {
        input: liveAcc.current.input + inputStep,
        output: outputLive,
      }
      if (open) {
        setLive({ input: liveAcc.current.input, output: liveAcc.current.output })
        wasLive.current = true
      }
    }
    void poll()
    const timer = setInterval(poll, 1000)
    return () => { open = false; clearInterval(timer) }
  }, [current, readPartial])

  // Current session from the authoritative projection (same source as all-session).
  const base = current !== undefined && byId !== undefined
    ? readBuckets(byId[current]?.projectionValues?.tokenUsage)
    : { input: 0, output: 0, hit: 0, miss: 0 }

  // Live tokens are the streamed partial tokenized directly:
  //   text/tool-call blocks -> output; reasoning blocks -> input.
  // Input only rises while the model is actually thinking (reasoning blocks);
  // when it is not thinking there is no live input delta, just the baseline.
  // At step end the partial clears and the authoritative `tokenUsage`
  // projection carries that step's real usage, so the delta resets cleanly.
  const outLive = settings.mode === 'live' ? live.output : 0
  const inLive = settings.mode === 'live' ? live.input : 0
  const inVal = base.input + inLive
  const outVal = base.output + outLive
  const totalVal = inVal + outVal

  let allIn = 0
  let allOut = 0
  let allHit = 0
  let allMiss = 0
  if (byId !== undefined) {
    for (const key of Object.keys(byId) as Array<keyof typeof byId>) {
      const b = readBuckets(byId[key]?.projectionValues?.tokenUsage)
      allIn += b.input
      allOut += b.output
      allHit += b.hit
      allMiss += b.miss
    }
  }

  const fmt = (n: number): string => (Number.isFinite(n) ? n.toLocaleString() : t('noData'))
  const sizePx = settings.textSize === 'small' ? 12 : settings.textSize === 'large' ? 16 : 14
  const alpha = (100 - settings.transparent) / 100

  // Transparency drives ONLY the backdrop: the background and the frosted blur
  // fade to nothing at 100%, while the border and shadow stay fixed so the
  // panel outline remains visible over the content.
  const panelStyle: React.CSSProperties = {
    fontSize: `${sizePx}px`,
    background: `rgba(20, 22, 26, ${alpha.toFixed(2)})`,
    backdropFilter: alpha > 0.05 ? 'blur(6px)' : 'none',
  }

  const est = inLive + outLive > 0 || justCalibrated

  return (
    <div className={css.panel} style={panelStyle}>
      <div className={css.head}>{t('title')}</div>
      <div className={css.groupTitle}>{t('current')}</div>
      <div className={css.row}><span className={css.label}>{t('inRow')}</span><span className={css.value + (est ? ` ${css.est}` : '')}>{fmt(inVal)}</span></div>
      <div className={css.row}><span className={css.label}>{t('outRow')}</span><span className={css.value + (est ? ` ${css.est}` : '')}>{fmt(outVal)}</span></div>
      <div className={css.row}><span className={css.label}>{t('hit')}</span><span className={css.value}>{fmt(base.hit)}</span></div>
      <div className={css.row}><span className={css.label}>{t('miss')}</span><span className={css.value}>{fmt(base.miss)}</span></div>
      <div className={css.row}><span className={css.label}>{t('total')}</span><span className={css.value + (est ? ` ${css.est}` : '')}>{fmt(totalVal)}</span></div>
      <div className={css.divider} />
      <div className={css.groupTitle}>{t('all')}</div>
      <div className={css.row}><span className={css.label}>{t('allIn')}</span><span className={css.value}>{fmt(allIn)}</span></div>
      <div className={css.row}><span className={css.label}>{t('allOut')}</span><span className={css.value}>{fmt(allOut)}</span></div>
      <div className={css.row}><span className={css.label}>{t('allHit')}</span><span className={css.value}>{fmt(allHit)}</span></div>
      <div className={css.row}><span className={css.label}>{t('allMiss')}</span><span className={css.value}>{fmt(allMiss)}</span></div>
    </div>
  )
}
