/**
 * Skin discovery tests: a package ships a skin via skin.json (through
 * `exports["./skin.json"]` or the package root), and the loader-entries walk
 * lists every installed skin with its live enabled state.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { baseUrlToDir, discoverSkins, previewContentType, resolvePackageDir, resolvePreviewFile, resolveSkinMeta, type DiscoveryHost } from '../src/index.ts'

let root = ''

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'skin-switcher-disc-'))
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

function writePkg(dir: string, manifest: Record<string, unknown>, skin?: Record<string, unknown>): void {
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'package.json'), JSON.stringify(manifest, undefined, 2))
  if (skin !== undefined) writeFileSync(join(dir, 'skin.json'), JSON.stringify(skin, undefined, 2))
}

describe('resolveSkinMeta', () => {
  it('reads skin.json through the exports field', () => {
    const pkgDir = join(root, 'pkg-exports')
    writePkg(
      pkgDir,
      { name: '@fixture/skin-a', exports: { './skin.json': './skin.json' } },
      { id: 'maid', name: '女仆', nameEn: 'Maid', author: 'a', accent: '#c5a468', preview: { light: 'preview/light.webp' }, order: 5 },
    )
    const meta = resolveSkinMeta(pkgDir)
    expect(meta).toMatchObject({
      skinId: 'maid', name: '女仆', nameEn: 'Maid', author: 'a', accent: '#c5a468', order: 5,
      preview: { light: 'preview/light.webp' },
    })
  })

  it('falls back to the package-root skin.json without an exports declaration', () => {
    const pkgDir = join(root, 'pkg-root')
    writePkg(pkgDir, { name: '@fixture/skin-b' }, { id: 'b', name: 'B' })
    expect(resolveSkinMeta(pkgDir)?.skinId).toBe('b')
  })

  it('returns undefined for packages without a skin.json', () => {
    const pkgDir = join(root, 'pkg-plain')
    writePkg(pkgDir, { name: '@fixture/plain' })
    expect(resolveSkinMeta(pkgDir)).toBeUndefined()
  })

  it('returns undefined for a malformed skin.json', () => {
    const pkgDir = join(root, 'pkg-bad')
    writePkg(pkgDir, { name: '@fixture/bad' }, { name: 'no id here' })
    expect(resolveSkinMeta(pkgDir)).toBeUndefined()
  })
})

describe('baseUrlToDir', () => {
  it("converts the include's file:// baseUrl into a filesystem directory", () => {
    expect(baseUrlToDir('file:///C:/Users/x/.dsh/profiles/web/')).toBe('C:\\Users\\x\\.dsh\\profiles\\web\\')
  })

  it('passes plain paths through unchanged', () => {
    expect(baseUrlToDir('C:\\Users\\x\\.dsh\\profiles\\web')).toBe('C:\\Users\\x\\.dsh\\profiles\\web')
  })
})

describe('resolvePackageDir', () => {
  it('resolves a package under the profile node_modules', () => {
    const pkgDir = join(root, 'node_modules', '@fixture', 'skin-a')
    writePkg(pkgDir, { name: '@fixture/skin-a' }, { id: 'a', name: 'A' })
    expect(resolvePackageDir(root, '@fixture/skin-a')).toBe(pkgDir)
  })

  it('returns undefined for an unresolvable package', () => {
    expect(resolvePackageDir(root, '@fixture/absent')).toBeUndefined()
  })
})

describe('discoverSkins', () => {
  it('lists skins from loader entries with live enabled state, skipping plain packages', () => {
    const skinDir = join(root, 'node_modules', '@fixture', 'skin-a')
    writePkg(skinDir, { name: '@fixture/skin-a' }, { id: 'a', name: 'A', order: 1, preview: { dark: 'preview/dark.webp' } })
    writePkg(join(root, 'node_modules', '@fixture', 'plain'), { name: '@fixture/plain' })
    const host: DiscoveryHost = {
      baseUrl: root,
      loader: {
        entries: () => [
          { options: { id: 'ui-skin-a', name: '@fixture/skin-a' }, disabled: false },
          { options: { id: 'plain', name: '@fixture/plain' }, disabled: false },
        ],
      },
    }
    const skins = discoverSkins(host)
    expect(skins).toHaveLength(1)
    expect(skins[0]).toMatchObject({ rowId: 'ui-skin-a', package: '@fixture/skin-a', enabled: true })
    expect(skins[0]!.previewUrl.dark).toContain('/skin-switcher/preview?pkg=')
  })

  it('reports a disabled skin as not enabled', () => {
    const skinDir = join(root, 'node_modules', '@fixture', 'skin-a')
    writePkg(skinDir, { name: '@fixture/skin-a' }, { id: 'a', name: 'A' })
    const host: DiscoveryHost = {
      baseUrl: root,
      loader: { entries: () => [{ options: { id: 'ui-skin-a', name: '@fixture/skin-a' }, disabled: true }] },
    }
    expect(discoverSkins(host)[0]!.enabled).toBe(false)
  })

  it('orders rows by skin.json order then name', () => {
    for (const [id, order] of [['z', 1], ['a', 2]] as const) {
      writePkg(
        join(root, 'node_modules', '@fixture', `skin-${id}`),
        { name: `@fixture/skin-${id}` },
        { id, name: `Skin ${id}`, order },
      )
    }
    const host: DiscoveryHost = {
      baseUrl: root,
      loader: {
        entries: () => [
          { options: { id: 'z', name: '@fixture/skin-z' }, disabled: false },
          { options: { id: 'a', name: '@fixture/skin-a' }, disabled: false },
        ],
      },
    }
    expect(discoverSkins(host).map(skin => skin.skinId)).toEqual(['z', 'a'])
  })
})

describe('resolvePreviewFile', () => {
  it('resolves inside the package root', () => {
    const pkgDir = join(root, 'pkg')
    expect(resolvePreviewFile(pkgDir, 'preview/light.webp')).toBe(join(pkgDir, 'preview', 'light.webp'))
  })

  it('rejects traversal outside the package root', () => {
    const pkgDir = join(root, 'pkg')
    const file = resolvePreviewFile(pkgDir, '../secret.webp')
    expect(file).toBeUndefined()
  })
})

describe('previewContentType', () => {
  it('covers every common web image format', () => {
    expect(previewContentType('preview/light.webp')).toBe('image/webp')
    expect(previewContentType('preview/light.png')).toBe('image/png')
    expect(previewContentType('preview/light.jpg')).toBe('image/jpeg')
    expect(previewContentType('preview/light.jpeg')).toBe('image/jpeg')
    expect(previewContentType('preview/light.gif')).toBe('image/gif')
    expect(previewContentType('preview/light.avif')).toBe('image/avif')
    expect(previewContentType('preview/light.svg')).toBe('image/svg+xml')
    expect(previewContentType('preview/light.bmp')).toBe('image/bmp')
    expect(previewContentType('preview/light.ico')).toBe('image/x-icon')
    expect(previewContentType('preview/light.heic')).toBe('image/heic')
    expect(previewContentType('preview/light.tiff')).toBe('image/tiff')
  })

  it('is case-insensitive and falls back for unknown extensions', () => {
    expect(previewContentType('preview/LIGHT.PNG')).toBe('image/png')
    expect(previewContentType('preview/light.xyz')).toBe('application/octet-stream')
  })
})
