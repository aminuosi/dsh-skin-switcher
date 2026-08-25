/**
 * Patch-layer writer tests: the managed block replaces only itself, the
 * initialized `[]` template is consumed, hand-written entries survive, and
 * the emitted file is a valid top-level YAML array the include can apply.
 */

import { describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { load as loadYaml } from 'js-yaml'
import {
  applyManagedRows, MANAGED_END, MANAGED_START, renderManagedBlock, writeSkinSelection,
} from '../src/index.ts'

const ROWS = [
  { id: 'ui-skin-maid-atelier', disabled: true },
  { id: 'ui-skin-coral', disabled: false },
]

const TEMPLATE = `# Your patch layer for this dsh profile, applied after every bundle layer:
# a top-level YAML array of loader patch entries (id-targeted config
# overrides, disables, and insert lists; \`!!js\` expressions allowed).
[]
`

function parseRows(content: string): Array<Record<string, unknown>> {
  const parsed = loadYaml(content) as Array<Record<string, unknown>>
  expect(Array.isArray(parsed)).toBe(true)
  return parsed
}

describe('renderManagedBlock', () => {
  it('renders one disabled row per selection with delimiters', () => {
    const block = renderManagedBlock(ROWS)
    expect(block).toContain(MANAGED_START)
    expect(block).toContain(MANAGED_END)
    expect(block).toContain('- id: ui-skin-maid-atelier\n  disabled: true')
    expect(block).toContain('- id: ui-skin-coral\n  disabled: false')
  })
})

describe('applyManagedRows', () => {
  it('replaces the initialized template `[]` with the managed block', () => {
    const merged = applyManagedRows(TEMPLATE, ROWS)
    expect(merged).not.toContain('[]')
    const rows = parseRows(merged)
    expect(rows).toContainEqual({ id: 'ui-skin-maid-atelier', disabled: true })
    expect(rows).toContainEqual({ id: 'ui-skin-coral', disabled: false })
    // The template comments stay intact.
    expect(merged).toContain('# Your patch layer for this dsh profile')
  })

  it('replaces a previous managed block instead of stacking', () => {
    const first = applyManagedRows(TEMPLATE, ROWS)
    const second = applyManagedRows(first, [{ id: 'ui-skin-maid-atelier', disabled: false }])
    const rows = parseRows(second)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toEqual({ id: 'ui-skin-maid-atelier', disabled: false })
    // No leftover from the first generation.
    expect(second.match(/- id:/g)).toHaveLength(1)
  })

  it('preserves hand-written entries outside the managed block', () => {
    const handWritten = `# my own layer
- id: session-telemetry-otel
  disabled: true
`
    const merged = applyManagedRows(handWritten, ROWS)
    expect(merged).toContain('# my own layer')
    expect(merged).toContain('- id: session-telemetry-otel\n  disabled: true')
    const rows = parseRows(merged)
    expect(rows).toHaveLength(3)
    expect(rows[0]).toEqual({ id: 'session-telemetry-otel', disabled: true })
  })

  it('handles a bare `[]` file', () => {
    const merged = applyManagedRows('[]\n', ROWS)
    const rows = parseRows(merged)
    expect(rows).toHaveLength(2)
    expect(merged.endsWith('\n')).toBe(true)
  })

  it('re-apply after an empty selection (all disabled) stays parseable', () => {
    const allDisabled = ROWS.map(row => ({ ...row, disabled: true }))
    const merged = applyManagedRows(TEMPLATE, allDisabled)
    const rows = parseRows(merged)
    expect(rows).toHaveLength(2)
    expect(rows.every(row => row.disabled === true)).toBe(true)
  })
})

describe('writeSkinSelection', () => {
  it('writes a parseable patch file and preserves unrelated edits on the next write', () => {
    const dir = mkdtempSync(join(tmpdir(), 'skin-switcher-spec-'))
    const patchPath = join(dir, 'cordis.patch.yml')
    writeFileSync(patchPath, TEMPLATE)

    writeSkinSelection(patchPath, ROWS)
    const first = readFileSync(patchPath, 'utf8')
    expect(parseRows(first).map(row => row.id)).toEqual(['ui-skin-maid-atelier', 'ui-skin-coral'])

    // A hand edit lands AFTER the block (outside the managed section); the
    // next selection keeps it.
    const edited = first.replace(MANAGED_END, `${MANAGED_END}\n- id: user-row\n  config: { keep: true }`)
    writeFileSync(patchPath, edited)
    writeSkinSelection(patchPath, [{ id: 'ui-skin-coral', disabled: true }])
    const rows = parseRows(readFileSync(patchPath, 'utf8'))
    expect(rows).toContainEqual({ id: 'user-row', config: { keep: true } })
    expect(rows).toContainEqual({ id: 'ui-skin-coral', disabled: true })
  })

  it('creates the patch file when absent', () => {
    const dir = mkdtempSync(join(tmpdir(), 'skin-switcher-spec-'))
    const patchPath = join(dir, 'cordis.patch.yml')
    writeSkinSelection(patchPath, ROWS)
    const rows = parseRows(readFileSync(patchPath, 'utf8'))
    expect(rows).toHaveLength(2)
  })
})
