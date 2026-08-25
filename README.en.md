# dsh-skin-switcher

[中文](README.md) · **English**

> A skin switcher for the DeepSeek Harness (dsh) Web GUI — a **Settings page** that auto-discovers every installed skin, lets you pick one from a dropdown with **hover previews**, and applies it after a page refresh.

A pure Cordis plugin; no dsh source changes. Works out of the box with `skin.json`-based skins from the [dsh-deep-whale](https://github.com/Small-tailqwq/dsh-deep-whale) ecosystem.

## Highlights

- **Settings → Skins**: a dedicated settings page (section id `skin-switcher`, chosen to avoid collisions with other skin managers).
- **Dropdown with hover previews**: hovering an option shows a live preview thumbnail in a side panel (auto-picks light/dark per the active theme), plus name, tagline, author, and accent color.
- **Auto-discovery**: any loader entry whose package ships a `skin.json` (or `exports["./skin.json"]`) becomes an option; newly installed skins appear after a restart — no registry, no code changes.
- **Mutually exclusive**: exactly one skin is active at a time; **Default theme** restores the stock UI.
- **Clean activation**: switching writes loader-row disabled state, so the next page refresh loads only the selected skin's client bundle — not "load everything, flip the visuals".
- **Surgical patch writes**: only the managed block between marker comments in `cordis.patch.yml` is rewritten; hand-written entries and comments survive byte-for-byte. dsh's user-patch hot reload (`watchUserPatches`) recomposes the tree within seconds — no service restart needed.

## Install

```sh
cd <harness>
dsh plugin --profile web add ../dsh-skin-switcher          # local checkout
# or
dsh plugin --profile web add github:<you>/dsh-skin-switcher # GitHub
```

Restart `dsh --profile web`, then open **Settings → Skins**: the dropdown lists **Default theme** plus every installed skin; hover to preview, click to switch, the page refreshes and applies.

Remove:

```sh
dsh plugin --profile web remove @dsh-external/dsh-client-ui-skin-switcher
```

## Skin package protocol

Any dsh bundle is recognized as a skin — and appears in the dropdown — when it ships a `skin.json` (or `exports["./skin.json"]` pointing at one):

| Field | Meaning |
|---|---|
| `id` | skin identity (required) |
| `name` / `nameEn` | display name (zh/en) |
| `author` / `tagline` / `description` | author, tagline, description |
| `accent` | accent color (dropdown dot) |
| `preview.light` / `preview.dark` | relative preview paths (webp/png/jpg/gif/avif/svg all supported) |
| `order` | list ordering |

And it must install as a dsh bundle (`cordis.patch.yml` inserting its skin row, declared via `dsh.bundle.patch`).

Reference skins: [maid-atelier](https://github.com/Small-tailqwq/dsh-deep-whale), [dsh-client-ui-skin-claude](https://github.com/PAKIKNOWLEDGE/dsh-client-ui-skin-claude).

## How it works

1. **Discovery** — the host half walks loader entries, resolves each package with a `skin.json`, and builds the catalog (live enabled state + preview URLs).
2. **Select** — `POST /skin-switcher/select` enables the chosen skin row and disables every other, written into the managed block of `~/.dsh/profiles/<name>/cordis.patch.yml`.
3. **Apply** — dsh's user-patch hot reload recomposes the loader tree → `client-modules` recomputes `window.__DSH_BOOT__` → the refreshed page loads only the selected skin's bundle, whose client `apply()` decorates the UI.

## Routes

| Method | Path | Description |
|---|---|---|
| GET | `/skin-switcher/catalog` | Installed skins (name/author/accent/preview URLs/enabled state) |
| POST | `/skin-switcher/select` | body `{ "skinId": <row id or null> }`; `null` = default theme. Writes the patch and waits for recomposition |
| GET | `/skin-switcher/preview?pkg=<name>&mode=light\|dark` | Preview image (correct content-type by extension, traversal-guarded) |

## Development

```sh
pnpm install
pnpm test       # vitest: patch writing, skin discovery, preview MIME (23 cases)
pnpm typecheck
pnpm build      # tsdown → lib/index.js (host) + lib/client.js (browser)
```

`lib/` is committed distribution output, so `dsh plugin add` installs from a fresh clone without building.

## License

MIT
