# Changelog

## 0.1.0 — 2026-08-24

Initial release.

- Settings → Skins page (`settings.section` id `skin-switcher`): dropdown of installed skins + Default theme.
- Hover preview panel with light/dark previews (webp/png/jpg/jpeg/gif/avif/svg/bmp/ico/tiff/heic served with correct content-type).
- Auto-discovery of installed skins via `skin.json` (loader-entry walk).
- Mutual-exclusion selection persisted in the profile patch layer; live hot reload via `watchUserPatches`; page-refresh activation.
- Surgical managed-block patch writing (hand-written entries and comments preserved).
- Host routes: `GET /skin-switcher/catalog`, `POST /skin-switcher/select`, `GET /skin-switcher/preview`.
- Vitest suite covering patch writing, skin discovery, preview MIME mapping.
