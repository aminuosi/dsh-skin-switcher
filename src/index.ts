/**
 * Host half of the dsh skin switcher. Serves the skin catalog, applies a
 * selection, and serves skin preview images over the web server.
 *
 * Discovery: a package is a skin when it ships a `skin.json` (resolved
 * through `exports["./skin.json"]` or the package root). Every loader entry
 * is probed by its package name — enabled or disabled rows alike — so the
 * catalog lists everything installed, not just what is active.
 *
 * Selection: the profile's own `cordis.patch.yml` (the live-reloaded user
 * layer, watched by the launcher) carries one `disabled` row per known skin
 * row, `true` for every skin except the selected one. The watcher re-applies
 * the patch stack, the include mutates the loader entries, client-modules
 * recomposes `window.__DSH_BOOT__`, and the next page refresh loads only the
 * selected skin's bundle. The write is surgical: only the managed block
 * between {@link MANAGED_START} and {@link MANAGED_END} is replaced, so a
 * hand-edited patch file keeps every other entry and comment.
 * @module @dsh-external/dsh-client-ui-skin-switcher
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { createRequire } from 'node:module'
import { dirname, extname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Context } from '@deepseek-ai/cordis'

/** Stable Cordis plugin name. */
export const name = 'ui-skin-switcher'

/** URL prefix of every route this plugin owns. */
export const ROUTE_PREFIX = '/skin-switcher'

/** Filename of the profile user patch layer (the live-reloaded target). */
export const PROFILE_PATCH_FILENAME = 'cordis.patch.yml'

/** Managed-block delimiters: only the rows between them are rewritten. */
export const MANAGED_START = '# --- dsh skin-switcher: managed rows (rewritten by the Settings 皮肤 page; do not edit) ---'
export const MANAGED_END = '# --- dsh skin-switcher: end ---'

/** A trailing `[]` on its own line — the initialized profile template. */
const EMPTY_LIST_TAIL = /(^|\n)\[\]\s*$/

/** One skin row this plugin manages: the loader row id and its target state. */
export interface SkinRowPatch {
  /** Loader entry id of the skin row (`entry.options.id`). */
  id: string
  /** Whether the row must be disabled after the selection. */
  disabled: boolean
}

/** The skin.json metadata this plugin consumes. */
export interface SkinMeta {
  /** skin.json `id` (a stable skin identity, distinct from the loader row id). */
  skinId: string
  name: string
  nameEn?: string
  author?: string
  tagline?: string
  description?: string
  accent?: string
  bodyAttr?: string
  order?: number
  preview: { light?: string; dark?: string }
}

/** One catalog row returned to the browser. */
export interface SkinCatalogEntry extends SkinMeta {
  /** Loader entry id — the patch target and the selection key. */
  rowId: string
  /** Package name the row mounts. */
  package: string
  /** Whether the row is currently enabled (live loader state). */
  enabled: boolean
  /** Browser URLs of the skin's preview images. */
  previewUrl: { light?: string; dark?: string }
}

/** The slice of the host tree discovery reads. */
export interface DiscoveryHost {
  /** The config-tree baseUrl (the profile directory, anchor of node resolution). */
  baseUrl: string
  /** Loader entry face. */
  loader: { entries(): readonly LoaderEntryLike[] }
}

/** The slice of a loader entry discovery reads. */
export interface LoaderEntryLike {
  options: { id?: string; name?: string }
  disabled: boolean
}

/**
 * The config-tree baseUrl as a filesystem directory. The include sets
 * `ctx.baseUrl` to a `file://` URL string (`new URL('.', pathToFileURL(...))`),
 * while this plugin needs real paths for node resolution and patch writes.
 * @param baseUrl - the raw `ctx.baseUrl` (URL or plain path).
 * @returns the profile directory as a filesystem path.
 */
export function baseUrlToDir(baseUrl: string): string {
  return baseUrl.startsWith('file:') ? fileURLToPath(baseUrl) : baseUrl
}

/**
 * Resolve a package's root directory from the profile anchor — the same
 * node_modules parent-walk the Loader uses, so a skin installed under the
 * profile resolves exactly as its row would import it. Requires no
 * `exports["./package.json"]` declaration.
 * @param baseUrl - the profile directory (resolution anchor).
 * @param packageName - the package to locate.
 * @returns the absolute package directory, or undefined when unresolvable.
 */
export function resolvePackageDir(baseUrl: string, packageName: string): string | undefined {
  // createRequire treats its argument as a file, so anchor on a synthetic
  // filename inside the profile directory: the node_modules parent-walk then
  // starts at the profile's own node_modules (the directory itself would
  // shift the walk one level up and miss every profile-local package).
  const require = createRequire(join(baseUrlToDir(baseUrl), '__dsh_skin_switcher__.js'))
  for (const searchPath of require.resolve.paths(packageName) ?? []) {
    const candidate = join(searchPath, packageName)
    if (existsSync(join(candidate, 'package.json'))) return candidate
  }
  return undefined
}

/**
 * Read a package's skin.json (through `exports["./skin.json"]` when declared,
 * otherwise the package-root `skin.json`). A package without a parseable
 * skin.json is not a skin.
 * @param pkgDir - the package root directory.
 * @returns the parsed metadata, or undefined when the package is not a skin.
 */
export function resolveSkinMeta(pkgDir: string): SkinMeta | undefined {
  const manifestPath = join(pkgDir, 'package.json')
  if (!existsSync(manifestPath)) return undefined
  let manifest: Record<string, unknown>
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Record<string, unknown>
  } catch {
    return undefined
  }
  let skinRel: unknown
  if (typeof manifest.exports === 'object' && manifest.exports !== null) {
    skinRel = (manifest.exports as Record<string, unknown>)['./skin.json']
  }
  const skinPath = typeof skinRel === 'string' ? join(pkgDir, skinRel) : join(pkgDir, 'skin.json')
  if (!existsSync(skinPath)) return undefined
  let raw: Record<string, unknown>
  try {
    raw = JSON.parse(readFileSync(skinPath, 'utf8')) as Record<string, unknown>
  } catch {
    return undefined
  }
  if (typeof raw.id !== 'string') return undefined
  const preview = raw.preview as Record<string, unknown> | undefined
  return {
    skinId: raw.id,
    name: typeof raw.name === 'string' ? raw.name : raw.id,
    ...(typeof raw.nameEn === 'string' ? { nameEn: raw.nameEn } : {}),
    ...(typeof raw.author === 'string' ? { author: raw.author } : {}),
    ...(typeof raw.tagline === 'string' ? { tagline: raw.tagline } : {}),
    ...(typeof raw.description === 'string' ? { description: raw.description } : {}),
    ...(typeof raw.accent === 'string' ? { accent: raw.accent } : {}),
    ...(typeof raw.bodyAttr === 'string' ? { bodyAttr: raw.bodyAttr } : {}),
    ...(typeof raw.order === 'number' ? { order: raw.order } : {}),
    preview: {
      ...(typeof preview?.light === 'string' ? { light: preview.light } : {}),
      ...(typeof preview?.dark === 'string' ? { dark: preview.dark } : {}),
    },
  }
}

/** One preview image's browser URL. */
function previewUrl(packageName: string, mode: 'light' | 'dark'): string {
  return `${ROUTE_PREFIX}/preview?pkg=${encodeURIComponent(packageName)}&mode=${mode}`
}

/**
 * Enumerate every installed skin: each loader entry whose package ships a
 * skin.json, deduplicated by package name. Enabled state comes from the live
 * loader entry; rows are ordered by skin.json `order` (stable), then name.
 * @param host - the discovery anchor and loader.
 * @returns the catalog, in display order.
 */
export function discoverSkins(host: DiscoveryHost): SkinCatalogEntry[] {
  const out: SkinCatalogEntry[] = []
  const seen = new Set<string>()
  for (const entry of host.loader.entries()) {
    const packageName = entry.options?.name
    if (typeof packageName !== 'string' || packageName === '' || seen.has(packageName)) continue
    seen.add(packageName)
    const pkgDir = resolvePackageDir(host.baseUrl, packageName)
    if (pkgDir === undefined) continue
    const meta = resolveSkinMeta(pkgDir)
    if (meta === undefined) continue
    out.push({
      ...meta,
      rowId: entry.options?.id ?? packageName,
      package: packageName,
      enabled: !entry.disabled,
      previewUrl: {
        ...(meta.preview.light !== undefined ? { light: previewUrl(packageName, 'light') } : {}),
        ...(meta.preview.dark !== undefined ? { dark: previewUrl(packageName, 'dark') } : {}),
      },
    })
  }
  out.sort((a, b) => {
    const ao = a.order ?? Number.MAX_SAFE_INTEGER
    const bo = b.order ?? Number.MAX_SAFE_INTEGER
    if (ao !== bo) return ao - bo
    return a.name.localeCompare(b.name)
  })
  return out
}

/**
 * Render the managed patch block for one selection: every known skin row with
 * its target disabled state, delimited by the managed markers.
 * @param rows - the row patches to persist.
 * @returns the block text (markers included, no trailing blank line).
 */
export function renderManagedBlock(rows: readonly SkinRowPatch[]): string {
  const lines = [MANAGED_START]
  for (const row of rows) {
    lines.push(`- id: ${row.id}`, `  disabled: ${row.disabled ? 'true' : 'false'}`)
  }
  lines.push(MANAGED_END)
  return lines.join('\n')
}

/**
 * Replace the managed block inside one patch-file text: drop any previous
 * managed block, then append the new rows. Everything outside the block —
 * hand-written entries and comments — is preserved byte for byte. A trailing
 * `[]` (the initialized template) is replaced by the block; otherwise the
 * block is appended after the last entry.
 * @param content - the current patch-file text.
 * @param rows - the row patches to persist.
 * @returns the merged patch-file text.
 */
export function applyManagedRows(content: string, rows: readonly SkinRowPatch[]): string {
  const start = content.indexOf(MANAGED_START)
  if (start >= 0) {
    const end = content.indexOf(MANAGED_END, start)
    const blockEnd = end >= 0 ? end + MANAGED_END.length : content.length
    content = content.slice(0, start) + content.slice(blockEnd)
  }
  const block = renderManagedBlock(rows)
  const tail = content.match(EMPTY_LIST_TAIL)
  if (tail !== null && tail.index !== undefined) {
    return `${content.slice(0, tail.index)}\n${block}\n`
  }
  return `${content.trimEnd()}\n${block}\n`
}

/**
 * Persist one selection into the profile user patch layer. The file is
 * created with the template shape when absent. Writing triggers the
 * launcher's patch watcher, which live-recomposes the loader tree.
 * @param patchPath - absolute path of the profile's cordis.patch.yml.
 * @param rows - the row patches to persist.
 */
export function writeSkinSelection(patchPath: string, rows: readonly SkinRowPatch[]): void {
  const existing = existsSync(patchPath) ? readFileSync(patchPath, 'utf8') : '[]\n'
  writeFileSync(patchPath, applyManagedRows(existing, rows))
}

/**
 * Resolve a preview file inside a skin package, rejecting traversal outside
 * the package root.
 * @param pkgDir - the skin package root.
 * @param rel - the preview path from skin.json.
 * @returns the absolute preview path, or undefined when it escapes the package.
 */
export function resolvePreviewFile(pkgDir: string, rel: string): string | undefined {
  const file = resolve(pkgDir, rel)
  if (file !== pkgDir && !file.startsWith(pkgDir + sep)) return undefined
  return file
}

/** Preview image MIME types by extension — every format a skin may ship. */
const PREVIEW_MIME: Record<string, string> = {
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.apng': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.jfif': 'image/jpeg',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp',
  '.ico': 'image/x-icon',
  '.tif': 'image/tiff',
  '.tiff': 'image/tiff',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
}

/**
 * Content type for one preview file, from its extension (case-insensitive).
 * An extension outside the table answers the HTTP-correct octet-stream
 * default; skins should keep previews to the common web formats.
 * @param file - the preview file path.
 * @returns the MIME type to serve.
 */
export function previewContentType(file: string): string {
  return PREVIEW_MIME[extname(file).toLowerCase()] ?? 'application/octet-stream'
}

/** Read the request body as a JSON object, rejecting malformed payloads. */
function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolveBody, rejectBody) => {
    const chunks: Buffer[] = []
    let total = 0
    req.on('data', (chunk: Buffer) => {
      total += chunk.length
      if (total > 64 * 1024) {
        rejectBody(new Error('payload too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      try {
        const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          rejectBody(new Error('payload must be a JSON object'))
          return
        }
        resolveBody(parsed as Record<string, unknown>)
      } catch (error) {
        rejectBody(error instanceof Error ? error : new Error(String(error)))
      }
    })
    req.on('error', rejectBody)
  })
}

/** Send a small JSON response. */
function json(res: ServerResponse, status: number, value: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  res.end(JSON.stringify(value))
}

/**
 * Wait until the live loader entries reflect the requested selection, so the
 * select response arrives after the recomposition landed and a page refresh
 * cannot race it.
 * @param host - the discovery anchor and loader.
 * @param rows - the persisted row patches (the expected target state).
 * @param timeoutMs - polling budget; the watcher is normally sub-second.
 */
async function waitForSelection(host: DiscoveryHost, rows: readonly SkinRowPatch[], timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    const current = discoverSkins(host)
    const expected = new Map(rows.map(row => [row.id, row.disabled]))
    const ok = current.every(skin => expected.get(skin.rowId) === !skin.enabled)
    if (ok || Date.now() >= deadline) return
    await new Promise(resolveTimeout => setTimeout(resolveTimeout, 100))
  }
}

/** Register the three routes under {@link ROUTE_PREFIX}. */
export function registerRoutes(
  ctx: Context,
  scope: { webServer: { register(route: WebRoute): () => void } },
): void {
  const rawBaseUrl = ctx.baseUrl ?? ''
  if (rawBaseUrl === '') throw new Error('skin-switcher: ctx.baseUrl is unset — the profile patch path and package resolution need the profile directory')
  const host: DiscoveryHost = {
    // The include hands out a `file://` URL; this plugin needs the real
    // profile directory for node resolution and the patch-file write.
    baseUrl: baseUrlToDir(rawBaseUrl),
    loader: ctx.get('loader') as DiscoveryHost['loader'],
  }
  if (host.loader === undefined) throw new Error('skin-switcher: loader service missing')

  const routes: WebRoute[] = [catalogRoute(host), selectRoute(host), previewRoute(host)]
  for (const route of routes) {
    scope.webServer.register(route)
  }
}

/**
 * Wrap one handler so a failing request answers a JSON 500 with the reason
 * instead of the webserver's opaque 400 (and never a process exit).
 * @param handler - the raw route handler.
 * @returns the guarded handler.
 */
function guarded(handler: (req: IncomingMessage, res: ServerResponse) => Promise<void>): (req: IncomingMessage, res: ServerResponse) => Promise<void> {
  return async (req, res) => {
    try {
      await handler(req, res)
    } catch (error) {
      console.error(`[skin-switcher] ${req.method ?? '?'} ${req.url ?? '?'}: ${error instanceof Error ? error.stack ?? error.message : String(error)}`)
      if (res.headersSent) {
        res.destroy()
        return
      }
      json(res, 500, { error: error instanceof Error ? error.message : String(error) })
    }
  }
}

/** One route this plugin registers on the dsh web server. */
export interface WebRoute {
  name: string
  kind: 'exact'
  path: string
  handler: (req: IncomingMessage, res: ServerResponse) => Promise<void>
}

/** GET /skin-switcher/catalog — the installed-skins list. */
function catalogRoute(host: DiscoveryHost): WebRoute {
  return {
    name: 'skin-switcher-catalog',
    kind: 'exact',
    path: `${ROUTE_PREFIX}/catalog`,
    handler: guarded(async (_req, res) => {
      json(res, 200, { skins: discoverSkins(host) })
    }),
  }
}

/** POST /skin-switcher/select — persist one selection and await the recomposition. */
function selectRoute(host: DiscoveryHost): WebRoute {
  return {
    name: 'skin-switcher-select',
    kind: 'exact',
    path: `${ROUTE_PREFIX}/select`,
    handler: guarded(async (req, res) => {
      if (req.method !== 'POST') {
        res.writeHead(405)
        res.end()
        return
      }
      let body: Record<string, unknown>
      try {
        body = await readJsonBody(req)
      } catch (error) {
        json(res, 400, { error: `invalid request body: ${error instanceof Error ? error.message : String(error)}` })
        return
      }
      const requested = body.skinId
      const skinId = typeof requested === 'string' && requested !== '' ? requested : null
      const skins = discoverSkins(host)
      if (skinId !== null && !skins.some(skin => skin.rowId === skinId)) {
        json(res, 400, { error: `unknown skin row ${JSON.stringify(skinId)}` })
        return
      }
      const rows = skins.map(skin => ({ id: skin.rowId, disabled: skin.rowId !== skinId }))
      writeSkinSelection(join(host.baseUrl, PROFILE_PATCH_FILENAME), rows)
      await waitForSelection(host, rows, 3000)
      json(res, 200, { ok: true, skinId })
    }),
  }
}

/** GET /skin-switcher/preview?pkg=<name>&mode=light|dark — one preview image. */
function previewRoute(host: DiscoveryHost): WebRoute {
  return {
    name: 'skin-switcher-preview',
    kind: 'exact',
    path: `${ROUTE_PREFIX}/preview`,
    handler: guarded(async (req, res) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405)
        res.end()
        return
      }
      const url = new URL(req.url ?? '/', 'http://localhost')
      const packageName = url.searchParams.get('pkg') ?? ''
      const mode = url.searchParams.get('mode') === 'dark' ? 'dark' : 'light'
      const pkgDir = packageName === '' ? undefined : resolvePackageDir(host.baseUrl, packageName)
      const meta = pkgDir === undefined ? undefined : resolveSkinMeta(pkgDir)
      const rel = meta?.preview?.[mode]
      const file = meta !== undefined && rel !== undefined && pkgDir !== undefined
        ? resolvePreviewFile(pkgDir, rel)
        : undefined
      if (file === undefined || !existsSync(file)) {
        res.writeHead(404)
        res.end()
        return
      }
      // Skins ship previews in various formats; serve the right type.
      res.writeHead(200, { 'content-type': previewContentType(file), 'cache-control': 'public, max-age=3600' })
      if (req.method === 'HEAD') {
        res.end()
        return
      }
      res.end(await readFile(file))
    }),
  }
}

/**
 * Mount the plugin: bind the routes on the web server when it exists (the web
 * profile). The scoped inject keeps headless profiles untouched, mirroring
 * the pattern the vision plugin uses.
 * @param ctx - host plugin context.
 */
export function apply(ctx: Context): void {
  if (typeof ctx.inject !== 'function') return
  ctx.inject(['webServer'], (scope) => {
    try {
      // The scoped-inject callback's scope is the injected service face; the
      // cordis typing widens it, so narrow it to the route-registration seam.
      registerRoutes(ctx, scope as unknown as { webServer: { register(route: WebRoute): () => void } })
    } catch (error) {
      console.error(`[skin-switcher] routes skipped: ${error instanceof Error ? error.message : String(error)}`)
    }
  })
}
