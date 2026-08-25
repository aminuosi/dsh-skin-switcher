import { createRequire } from "node:module";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
//#region src/index.ts
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
/** Stable Cordis plugin name. */
const name = "ui-skin-switcher";
/** URL prefix of every route this plugin owns. */
const ROUTE_PREFIX = "/skin-switcher";
/** Filename of the profile user patch layer (the live-reloaded target). */
const PROFILE_PATCH_FILENAME = "cordis.patch.yml";
/** Managed-block delimiters: only the rows between them are rewritten. */
const MANAGED_START = "# --- dsh skin-switcher: managed rows (rewritten by the Settings 皮肤 page; do not edit) ---";
const MANAGED_END = "# --- dsh skin-switcher: end ---";
/** A trailing `[]` on its own line — the initialized profile template. */
const EMPTY_LIST_TAIL = /(^|\n)\[\]\s*$/;
/**
* The config-tree baseUrl as a filesystem directory. The include sets
* `ctx.baseUrl` to a `file://` URL string (`new URL('.', pathToFileURL(...))`),
* while this plugin needs real paths for node resolution and patch writes.
* @param baseUrl - the raw `ctx.baseUrl` (URL or plain path).
* @returns the profile directory as a filesystem path.
*/
function baseUrlToDir(baseUrl) {
	return baseUrl.startsWith("file:") ? fileURLToPath(baseUrl) : baseUrl;
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
function resolvePackageDir(baseUrl, packageName) {
	const require = createRequire(join(baseUrlToDir(baseUrl), "__dsh_skin_switcher__.js"));
	for (const searchPath of require.resolve.paths(packageName) ?? []) {
		const candidate = join(searchPath, packageName);
		if (existsSync(join(candidate, "package.json"))) return candidate;
	}
}
/**
* Read a package's skin.json (through `exports["./skin.json"]` when declared,
* otherwise the package-root `skin.json`). A package without a parseable
* skin.json is not a skin.
* @param pkgDir - the package root directory.
* @returns the parsed metadata, or undefined when the package is not a skin.
*/
function resolveSkinMeta(pkgDir) {
	const manifestPath = join(pkgDir, "package.json");
	if (!existsSync(manifestPath)) return void 0;
	let manifest;
	try {
		manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
	} catch {
		return;
	}
	let skinRel;
	if (typeof manifest.exports === "object" && manifest.exports !== null) skinRel = manifest.exports["./skin.json"];
	const skinPath = typeof skinRel === "string" ? join(pkgDir, skinRel) : join(pkgDir, "skin.json");
	if (!existsSync(skinPath)) return void 0;
	let raw;
	try {
		raw = JSON.parse(readFileSync(skinPath, "utf8"));
	} catch {
		return;
	}
	if (typeof raw.id !== "string") return void 0;
	const preview = raw.preview;
	return {
		skinId: raw.id,
		name: typeof raw.name === "string" ? raw.name : raw.id,
		...typeof raw.nameEn === "string" ? { nameEn: raw.nameEn } : {},
		...typeof raw.author === "string" ? { author: raw.author } : {},
		...typeof raw.tagline === "string" ? { tagline: raw.tagline } : {},
		...typeof raw.description === "string" ? { description: raw.description } : {},
		...typeof raw.accent === "string" ? { accent: raw.accent } : {},
		...typeof raw.bodyAttr === "string" ? { bodyAttr: raw.bodyAttr } : {},
		...typeof raw.order === "number" ? { order: raw.order } : {},
		preview: {
			...typeof preview?.light === "string" ? { light: preview.light } : {},
			...typeof preview?.dark === "string" ? { dark: preview.dark } : {}
		}
	};
}
/** One preview image's browser URL. */
function previewUrl(packageName, mode) {
	return `${ROUTE_PREFIX}/preview?pkg=${encodeURIComponent(packageName)}&mode=${mode}`;
}
/**
* Enumerate every installed skin: each loader entry whose package ships a
* skin.json, deduplicated by package name. Enabled state comes from the live
* loader entry; rows are ordered by skin.json `order` (stable), then name.
* @param host - the discovery anchor and loader.
* @returns the catalog, in display order.
*/
function discoverSkins(host) {
	const out = [];
	const seen = /* @__PURE__ */ new Set();
	for (const entry of host.loader.entries()) {
		const packageName = entry.options?.name;
		if (typeof packageName !== "string" || packageName === "" || seen.has(packageName)) continue;
		seen.add(packageName);
		const pkgDir = resolvePackageDir(host.baseUrl, packageName);
		if (pkgDir === void 0) continue;
		const meta = resolveSkinMeta(pkgDir);
		if (meta === void 0) continue;
		out.push({
			...meta,
			rowId: entry.options?.id ?? packageName,
			package: packageName,
			enabled: !entry.disabled,
			previewUrl: {
				...meta.preview.light !== void 0 ? { light: previewUrl(packageName, "light") } : {},
				...meta.preview.dark !== void 0 ? { dark: previewUrl(packageName, "dark") } : {}
			}
		});
	}
	out.sort((a, b) => {
		const ao = a.order ?? Number.MAX_SAFE_INTEGER;
		const bo = b.order ?? Number.MAX_SAFE_INTEGER;
		if (ao !== bo) return ao - bo;
		return a.name.localeCompare(b.name);
	});
	return out;
}
/**
* Render the managed patch block for one selection: every known skin row with
* its target disabled state, delimited by the managed markers.
* @param rows - the row patches to persist.
* @returns the block text (markers included, no trailing blank line).
*/
function renderManagedBlock(rows) {
	const lines = [MANAGED_START];
	for (const row of rows) lines.push(`- id: ${row.id}`, `  disabled: ${row.disabled ? "true" : "false"}`);
	lines.push(MANAGED_END);
	return lines.join("\n");
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
function applyManagedRows(content, rows) {
	const start = content.indexOf(MANAGED_START);
	if (start >= 0) {
		const end = content.indexOf(MANAGED_END, start);
		const blockEnd = end >= 0 ? end + 32 : content.length;
		content = content.slice(0, start) + content.slice(blockEnd);
	}
	const block = renderManagedBlock(rows);
	const tail = content.match(EMPTY_LIST_TAIL);
	if (tail !== null && tail.index !== void 0) return `${content.slice(0, tail.index)}\n${block}\n`;
	return `${content.trimEnd()}\n${block}\n`;
}
/**
* Persist one selection into the profile user patch layer. The file is
* created with the template shape when absent. Writing triggers the
* launcher's patch watcher, which live-recomposes the loader tree.
* @param patchPath - absolute path of the profile's cordis.patch.yml.
* @param rows - the row patches to persist.
*/
function writeSkinSelection(patchPath, rows) {
	const existing = existsSync(patchPath) ? readFileSync(patchPath, "utf8") : "[]\n";
	writeFileSync(patchPath, applyManagedRows(existing, rows));
}
/**
* Resolve a preview file inside a skin package, rejecting traversal outside
* the package root.
* @param pkgDir - the skin package root.
* @param rel - the preview path from skin.json.
* @returns the absolute preview path, or undefined when it escapes the package.
*/
function resolvePreviewFile(pkgDir, rel) {
	const file = resolve(pkgDir, rel);
	if (file !== pkgDir && !file.startsWith(pkgDir + sep)) return void 0;
	return file;
}
/** Preview image MIME types by extension — every format a skin may ship. */
const PREVIEW_MIME = {
	".webp": "image/webp",
	".png": "image/png",
	".apng": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".jfif": "image/jpeg",
	".gif": "image/gif",
	".avif": "image/avif",
	".svg": "image/svg+xml",
	".bmp": "image/bmp",
	".ico": "image/x-icon",
	".tif": "image/tiff",
	".tiff": "image/tiff",
	".heic": "image/heic",
	".heif": "image/heif"
};
/**
* Content type for one preview file, from its extension (case-insensitive).
* An extension outside the table answers the HTTP-correct octet-stream
* default; skins should keep previews to the common web formats.
* @param file - the preview file path.
* @returns the MIME type to serve.
*/
function previewContentType(file) {
	return PREVIEW_MIME[extname(file).toLowerCase()] ?? "application/octet-stream";
}
/** Read the request body as a JSON object, rejecting malformed payloads. */
function readJsonBody(req) {
	return new Promise((resolveBody, rejectBody) => {
		const chunks = [];
		let total = 0;
		req.on("data", (chunk) => {
			total += chunk.length;
			if (total > 65536) {
				rejectBody(/* @__PURE__ */ new Error("payload too large"));
				req.destroy();
				return;
			}
			chunks.push(chunk);
		});
		req.on("end", () => {
			try {
				const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
				if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
					rejectBody(/* @__PURE__ */ new Error("payload must be a JSON object"));
					return;
				}
				resolveBody(parsed);
			} catch (error) {
				rejectBody(error instanceof Error ? error : new Error(String(error)));
			}
		});
		req.on("error", rejectBody);
	});
}
/** Send a small JSON response. */
function json(res, status, value) {
	res.writeHead(status, {
		"content-type": "application/json; charset=utf-8",
		"cache-control": "no-store"
	});
	res.end(JSON.stringify(value));
}
/**
* Wait until the live loader entries reflect the requested selection, so the
* select response arrives after the recomposition landed and a page refresh
* cannot race it.
* @param host - the discovery anchor and loader.
* @param rows - the persisted row patches (the expected target state).
* @param timeoutMs - polling budget; the watcher is normally sub-second.
*/
async function waitForSelection(host, rows, timeoutMs) {
	const deadline = Date.now() + timeoutMs;
	for (;;) {
		const current = discoverSkins(host);
		const expected = new Map(rows.map((row) => [row.id, row.disabled]));
		if (current.every((skin) => expected.get(skin.rowId) === !skin.enabled) || Date.now() >= deadline) return;
		await new Promise((resolveTimeout) => setTimeout(resolveTimeout, 100));
	}
}
/** Register the three routes under {@link ROUTE_PREFIX}. */
function registerRoutes(ctx, scope) {
	const rawBaseUrl = ctx.baseUrl ?? "";
	if (rawBaseUrl === "") throw new Error("skin-switcher: ctx.baseUrl is unset — the profile patch path and package resolution need the profile directory");
	const host = {
		baseUrl: baseUrlToDir(rawBaseUrl),
		loader: ctx.get("loader")
	};
	if (host.loader === void 0) throw new Error("skin-switcher: loader service missing");
	const routes = [
		catalogRoute(host),
		selectRoute(host),
		previewRoute(host)
	];
	for (const route of routes) scope.webServer.register(route);
}
/**
* Wrap one handler so a failing request answers a JSON 500 with the reason
* instead of the webserver's opaque 400 (and never a process exit).
* @param handler - the raw route handler.
* @returns the guarded handler.
*/
function guarded(handler) {
	return async (req, res) => {
		try {
			await handler(req, res);
		} catch (error) {
			console.error(`[skin-switcher] ${req.method ?? "?"} ${req.url ?? "?"}: ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
			if (res.headersSent) {
				res.destroy();
				return;
			}
			json(res, 500, { error: error instanceof Error ? error.message : String(error) });
		}
	};
}
/** GET /skin-switcher/catalog — the installed-skins list. */
function catalogRoute(host) {
	return {
		name: "skin-switcher-catalog",
		kind: "exact",
		path: `${ROUTE_PREFIX}/catalog`,
		handler: guarded(async (_req, res) => {
			json(res, 200, { skins: discoverSkins(host) });
		})
	};
}
/** POST /skin-switcher/select — persist one selection and await the recomposition. */
function selectRoute(host) {
	return {
		name: "skin-switcher-select",
		kind: "exact",
		path: `${ROUTE_PREFIX}/select`,
		handler: guarded(async (req, res) => {
			if (req.method !== "POST") {
				res.writeHead(405);
				res.end();
				return;
			}
			let body;
			try {
				body = await readJsonBody(req);
			} catch (error) {
				json(res, 400, { error: `invalid request body: ${error instanceof Error ? error.message : String(error)}` });
				return;
			}
			const requested = body.skinId;
			const skinId = typeof requested === "string" && requested !== "" ? requested : null;
			const skins = discoverSkins(host);
			if (skinId !== null && !skins.some((skin) => skin.rowId === skinId)) {
				json(res, 400, { error: `unknown skin row ${JSON.stringify(skinId)}` });
				return;
			}
			const rows = skins.map((skin) => ({
				id: skin.rowId,
				disabled: skin.rowId !== skinId
			}));
			writeSkinSelection(join(host.baseUrl, PROFILE_PATCH_FILENAME), rows);
			await waitForSelection(host, rows, 3e3);
			json(res, 200, {
				ok: true,
				skinId
			});
		})
	};
}
/** GET /skin-switcher/preview?pkg=<name>&mode=light|dark — one preview image. */
function previewRoute(host) {
	return {
		name: "skin-switcher-preview",
		kind: "exact",
		path: `${ROUTE_PREFIX}/preview`,
		handler: guarded(async (req, res) => {
			if (req.method !== "GET" && req.method !== "HEAD") {
				res.writeHead(405);
				res.end();
				return;
			}
			const url = new URL(req.url ?? "/", "http://localhost");
			const packageName = url.searchParams.get("pkg") ?? "";
			const mode = url.searchParams.get("mode") === "dark" ? "dark" : "light";
			const pkgDir = packageName === "" ? void 0 : resolvePackageDir(host.baseUrl, packageName);
			const meta = pkgDir === void 0 ? void 0 : resolveSkinMeta(pkgDir);
			const rel = meta?.preview?.[mode];
			const file = meta !== void 0 && rel !== void 0 && pkgDir !== void 0 ? resolvePreviewFile(pkgDir, rel) : void 0;
			if (file === void 0 || !existsSync(file)) {
				res.writeHead(404);
				res.end();
				return;
			}
			res.writeHead(200, {
				"content-type": previewContentType(file),
				"cache-control": "public, max-age=3600"
			});
			if (req.method === "HEAD") {
				res.end();
				return;
			}
			res.end(await readFile(file));
		})
	};
}
/**
* Mount the plugin: bind the routes on the web server when it exists (the web
* profile). The scoped inject keeps headless profiles untouched, mirroring
* the pattern the vision plugin uses.
* @param ctx - host plugin context.
*/
function apply(ctx) {
	if (typeof ctx.inject !== "function") return;
	ctx.inject(["webServer"], (scope) => {
		try {
			registerRoutes(ctx, scope);
		} catch (error) {
			console.error(`[skin-switcher] routes skipped: ${error instanceof Error ? error.message : String(error)}`);
		}
	});
}
//#endregion
export { MANAGED_END, MANAGED_START, PROFILE_PATCH_FILENAME, ROUTE_PREFIX, apply, applyManagedRows, baseUrlToDir, discoverSkins, name, previewContentType, registerRoutes, renderManagedBlock, resolvePackageDir, resolvePreviewFile, resolveSkinMeta, writeSkinSelection };
