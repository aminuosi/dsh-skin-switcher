/**
 * Skins settings section: a dropdown of every installed skin (catalog from
 * the host route) plus the default-theme entry. Hovering an option shows its
 * preview in a side panel; choosing one persists the selection and reloads
 * the page once the server has applied it. The host already waited for the
 * loader recomposition before answering, so the reload cannot race the patch
 * watcher.
 * @module @dsh-external/dsh-client-ui-skin-switcher/client/SkinsSection
 */

import { useCallback, useEffect, useState } from 'react'
import type { ReactElement } from 'react'
import styles from './SkinsSection.module.css'
import type { SkinSwitchKey } from './locales.ts'

/** One catalog row as served by /skin-switcher/catalog. */
export interface SkinCatalogEntry {
  rowId: string
  package: string
  skinId: string
  name: string
  nameEn?: string
  author?: string
  tagline?: string
  description?: string
  accent?: string
  bodyAttr?: string
  order?: number
  enabled: boolean
  previewUrl?: { light?: string; dark?: string }
}

/** The business face the settings shell injects into this section. */
export interface SkinsSectionInjected {
  /** Bound translator for the `settings.skins` namespace. */
  t: (key: SkinSwitchKey) => string
}

/** Props delivered by the slot outlet: the inject face spread flat. */
export type SkinsSectionProps = Partial<SkinsSectionInjected>

/** Selection status shown under the dropdown. */
type Status =
  | { kind: 'idle' }
  | { kind: 'busy' }
  | { kind: 'done' }
  | { kind: 'error'; message: string }

/** Catalog load state. */
type LoadState =
  | { kind: 'loading' }
  | { kind: 'ready'; skins: SkinCatalogEntry[] }
  | { kind: 'failed' }

/** A dropdown selection: a skin row id, or null for the default theme. */
type SelectionKey = string | null

/**
 * The Skins settings page.
 * @param props - the injected translator (spread by the slot outlet).
 * @returns the section's React tree.
 */
export function SkinsSection(props: SkinsSectionProps): ReactElement {
  const t = props.t ?? ((key: SkinSwitchKey): string => key)
  const [load, setLoad] = useState<LoadState>({ kind: 'loading' })
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState<SelectionKey | undefined>(undefined)
  const [dark, setDark] = useState(() => document.body.hasAttribute('data-ds-dark-theme'))

  const loadCatalog = useCallback(async (): Promise<void> => {
    setLoad({ kind: 'loading' })
    try {
      const response = await fetch('/skin-switcher/catalog', { headers: { accept: 'application/json' } })
      if (!response.ok) throw new Error(`catalog ${String(response.status)}`)
      const data = await response.json() as { skins?: SkinCatalogEntry[] }
      setLoad({ kind: 'ready', skins: Array.isArray(data.skins) ? data.skins : [] })
    } catch {
      setLoad({ kind: 'failed' })
    }
  }, [])

  useEffect(() => { void loadCatalog() }, [loadCatalog])

  // Close on outside press or Escape while the popover is open.
  useEffect(() => {
    if (!open) return
    const onDown = (event: MouseEvent): void => {
      const target = event.target as Element | null
      if (target === null) return
      if (target.closest(`.${styles.popover}`) !== null || target.closest(`.${styles.trigger}`) !== null) return
      setOpen(false)
    }
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const select = useCallback(async (key: SelectionKey): Promise<void> => {
    if (status.kind === 'busy') return
    setStatus({ kind: 'busy' })
    setOpen(false)
    setHovered(undefined)
    try {
      const response = await fetch('/skin-switcher/select', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ skinId: key }),
      })
      if (!response.ok) throw new Error(`select ${String(response.status)}`)
      setStatus({ kind: 'done' })
      window.setTimeout(() => window.location.reload(), 500)
    } catch {
      setStatus({ kind: 'error', message: t('applyError') })
    }
  }, [status.kind, t])

  if (load.kind === 'loading') {
    return <p className={styles.note}>{t('applying')}</p>
  }
  if (load.kind === 'failed') {
    return (
      <div className={styles.note}>
        <p>{t('loadError')}</p>
        <button type="button" className={styles.retry} onClick={() => void loadCatalog()}>{t('retry')}</button>
      </div>
    )
  }

  const skins = load.skins
  const activeKey: SelectionKey = skins.find(skin => skin.enabled)?.rowId ?? null
  const activeName = activeKey === null
    ? t('default')
    : (skins.find(skin => skin.rowId === activeKey)?.name ?? t('default'))
  const previewKey = open ? (hovered ?? activeKey) : activeKey
  const previewSkin = previewKey === null ? undefined : skins.find(skin => skin.rowId === previewKey)
  const busy = status.kind === 'busy'

  return (
    <div className={styles.root}>
      <p className={styles.hint}>{t('hint')}</p>

      <div className={styles.combo}>
        <button
          type="button"
          className={styles.trigger}
          onClick={() => setOpen(value => !value)}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className={styles.triggerLabel}>{activeName}</span>
          <span className={styles.caret} aria-hidden="true">▾</span>
        </button>

        {open && (
          <div className={styles.popover} role="listbox" aria-label={t('title')}>
            <ul className={styles.list}>
              <OptionRow
                active={activeKey === null}
                name={t('default')}
                accent={undefined}
                onHover={() => setHovered(null)}
                onClick={() => void select(null)}
                busy={busy}
              />
              {skins.map(skin => (
                <OptionRow
                  key={skin.rowId}
                  active={skin.enabled}
                  name={skin.name}
                  nameEn={skin.nameEn}
                  accent={skin.accent}
                  onHover={() => setHovered(skin.rowId)}
                  onClick={() => void select(skin.rowId)}
                  busy={busy}
                />
              ))}
            </ul>

            <div className={styles.previewPanel} aria-hidden="true">
              {previewSkin === undefined
                ? (
                  <div className={styles.previewDefault}>
                    <span className={styles.previewDefaultGlyph}>✦</span>
                    <span>{t('default')}</span>
                  </div>
                )
                : (
                  <>
                    {previewSkin.previewUrl?.[dark ? 'dark' : 'light'] !== undefined
                      ? (
                        <img
                          src={previewSkin.previewUrl![dark ? 'dark' : 'light']}
                          alt=""
                          className={styles.previewImage}
                        />
                      )
                      : <div className={styles.previewFallback} />}
                    <div className={styles.previewMeta}>
                      <span className={styles.previewName}>{previewSkin.name}</span>
                      {previewSkin.tagline !== undefined && previewSkin.tagline !== ''
                        && <span className={styles.previewTagline}>{previewSkin.tagline}</span>}
                      {previewSkin.author !== undefined && previewSkin.author !== ''
                        && <span className={styles.previewAuthor}>{previewSkin.author}</span>}
                    </div>
                  </>
                )}
            </div>
          </div>
        )}
      </div>

      {status.kind === 'busy' && <p className={styles.note}>{t('applying')}</p>}
      {status.kind === 'done' && <p className={styles.note}>{t('refreshed')}</p>}
      {status.kind === 'error' && (
        <div className={styles.note}>
          <p>{status.message}</p>
          <button type="button" className={styles.retry} onClick={() => window.location.reload()}>{t('refresh')}</button>
        </div>
      )}
    </div>
  )
}

/** One dropdown option row. */
interface OptionRowProps {
  active: boolean
  name: string
  nameEn?: string
  accent: string | undefined
  onHover: () => void
  onClick: () => void
  busy: boolean
}

function OptionRow({ active, name, nameEn, accent, onHover, onClick, busy }: OptionRowProps): ReactElement {
  return (
    <li className={styles.optionItem}>
      <button
        type="button"
        className={`${styles.option}${active ? ` ${styles.optionActive}` : ''}`}
        role="option"
        aria-selected={active}
        onMouseEnter={onHover}
        onClick={onClick}
        disabled={busy}
      >
        {accent !== undefined && <span className={styles.accent} style={{ background: accent }} aria-hidden="true" />}
        <span className={styles.optionName}>{name}</span>
        {nameEn !== undefined && nameEn !== '' && <span className={styles.optionNameEn}>{nameEn}</span>}
        {active && <span className={styles.activeTick} aria-hidden="true">✓</span>}
      </button>
    </li>
  )
}
