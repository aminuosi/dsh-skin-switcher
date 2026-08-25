/**
 * Skin switcher plugin, browser half. Registers the 皮肤 (Skins) settings
 * section once the shell declares `settings.section`. The section fetches the
 * catalog from the host route, lets the user pick a skin, and reloads the
 * page after the selection is applied. Export discipline: only what the cordis
 * Loader needs (name/inject/apply) plus the section's public types.
 * @module @dsh-external/dsh-client-ui-skin-switcher/client
 */

import { SkinsSection } from './SkinsSection.tsx'
import type { SkinsSectionInjected } from './SkinsSection.tsx'
import { en, NS, zh, type SkinSwitchKey } from './locales.ts'

export type { SkinsSectionInjected, SkinsSectionProps, SkinCatalogEntry } from './SkinsSection.tsx'
export type { SkinSwitchKey } from './locales.ts'

/** Stable Cordis plugin name (matches the bundle patch row id). */
export const name = 'ui-skin-switcher'

/** Required services (cordis fiber inject): slots for the settings section, locale for copy. */
export const inject = ['slots', 'locale']

/** Structural face of the services this plugin uses. */
interface SkinSwitchContext {
  effect(fn: () => (() => void) | void, label: string): void
  slots: {
    inject(name: string, factory: () => () => void): void
    register(options: { name: string; id: string; order: number; label: () => string; inject: () => SkinsSectionInjected }, component: unknown): () => void
  }
  locale: {
    register(ns: string, dict: { zh: unknown; en: unknown }): () => void
    bind(ns: string): (key: SkinSwitchKey) => string
  }
}

/**
 * Register the Skins section once the `settings.section` declaration is on
 * the ledger, and keep its copy registered for the plugin lifetime. The
 * section id and locale namespace use the `skin-switcher` name (not the
 * generic `skins`) so this plugin cannot collide with another skin manager
 * that claims the same slot id.
 * @param ctx - client root context.
 */
export function apply(ctx: SkinSwitchContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'skin-switcher: copy dictionaries')
  const t = ctx.locale.bind(NS)
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'skin-switcher',
    order: 20,
    label: () => t('nav'),
    inject: () => ({ t }),
  }, SkinsSection))
}
