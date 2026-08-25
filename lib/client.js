window.__ModuleLoader__.load({
	id: "@dsh-external/dsh-client-ui-skin-switcher",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region \0dsh-css:src/client/SkinsSection.module.css.mjs
		const css = ".L2K8yG_root{flex-direction:column;gap:14px;display:flex}.L2K8yG_hint{color:var(--dsw-alias-label-tertiary,#808080d9);margin:0;font-size:13px;line-height:1.6}.L2K8yG_combo{align-self:flex-start;position:relative}.L2K8yG_trigger{border:1px solid var(--dsw-alias-button-ghost-active-border,#80808059);background:var(--dsw-alias-bg-overlay,#8080801f);min-width:260px;color:var(--dsw-alias-label-primary,#222);font:inherit;cursor:pointer;border-radius:10px;justify-content:space-between;align-items:center;gap:10px;padding:9px 12px;font-size:14px;display:flex}.L2K8yG_trigger:hover,.L2K8yG_trigger[aria-expanded=true]{background:var(--dsw-alias-interactive-bg-hover,#80808029)}.L2K8yG_triggerLabel{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.L2K8yG_caret{color:var(--dsw-alias-label-tertiary,#808080d9);flex:none;font-size:12px}.L2K8yG_popover{z-index:30;border:1px solid var(--dsw-alias-button-ghost-active-border,#80808059);background:var(--dsw-alias-bg-overlay,#8080801f);border-radius:12px;gap:12px;padding:10px;display:flex;position:absolute;top:calc(100% + 6px);left:0;box-shadow:0 10px 28px #00000038}.L2K8yG_list{flex-direction:column;gap:2px;min-width:220px;max-height:280px;margin:0;padding:0;list-style:none;display:flex;overflow-y:auto}.L2K8yG_optionItem{margin:0}.L2K8yG_option{width:100%;color:var(--dsw-alias-label-primary,#222);font:inherit;text-align:left;cursor:pointer;background:0 0;border:0;border-radius:8px;align-items:center;gap:8px;padding:8px 10px;font-size:13px;display:flex}.L2K8yG_option:not(:disabled):hover{background:var(--dsw-alias-interactive-bg-hover,#80808029)}.L2K8yG_optionActive{background:var(--dsw-alias-interactive-bg-active,#80808038)}.L2K8yG_option:disabled{cursor:default;opacity:.65}.L2K8yG_accent{border-radius:50%;flex:none;width:10px;height:10px;box-shadow:0 0 0 1px #80808066}.L2K8yG_optionName{text-overflow:ellipsis;white-space:nowrap;flex:1;overflow:hidden}.L2K8yG_optionNameEn{color:var(--dsw-alias-label-tertiary,#808080d9);flex:none;font-size:12px}.L2K8yG_activeTick{color:var(--dsw-alias-state-success-primary,#2f9e6e);flex:none}.L2K8yG_previewPanel{background:#80808024;border-radius:10px;flex-direction:column;width:224px;display:flex;overflow:hidden}.L2K8yG_previewImage{aspect-ratio:16/9;object-fit:cover;width:100%;display:block}.L2K8yG_previewFallback{aspect-ratio:16/9;width:100%;color:var(--dsw-alias-label-tertiary,#808080d9);flex-direction:column;justify-content:center;align-items:center;gap:6px;font-size:12px;display:flex}.L2K8yG_previewMonogram{color:var(--dsw-alias-label-secondary,#808080b3);font-size:26px;font-weight:600}.L2K8yG_previewNoImage{font-size:11px}.L2K8yG_previewDefault{aspect-ratio:16/9;color:var(--dsw-alias-label-tertiary,#808080d9);flex-direction:column;justify-content:center;align-items:center;gap:8px;font-size:13px;display:flex}.L2K8yG_previewDefaultGlyph{font-size:22px}.L2K8yG_previewMeta{flex-direction:column;gap:3px;padding:8px 10px;display:flex}.L2K8yG_previewName{color:var(--dsw-alias-label-primary,#222);font-size:13px;font-weight:600}.L2K8yG_previewTagline,.L2K8yG_previewAuthor{color:var(--dsw-alias-label-secondary,#555);font-size:12px;line-height:1.5}.L2K8yG_note{color:var(--dsw-alias-label-secondary,#555);margin:0;font-size:13px;line-height:1.6}.L2K8yG_retry{border:1px solid var(--dsw-alias-button-ghost-active-border,#80808059);background:var(--dsw-alias-bg-overlay,#8080801f);color:var(--dsw-alias-label-primary,#222);font:inherit;cursor:pointer;border-radius:8px;margin-top:8px;padding:5px 14px;font-size:13px}.L2K8yG_retry:hover{background:var(--dsw-alias-interactive-bg-hover,#80808029)}";
		const tagId = "@dsh-external/dsh-client-ui-skin-switcher/SkinsSection.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-external/dsh-client-ui-skin-switcher";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var SkinsSection_module_css_default = {
			"accent": "L2K8yG_accent",
			"activeTick": "L2K8yG_activeTick",
			"caret": "L2K8yG_caret",
			"combo": "L2K8yG_combo",
			"hint": "L2K8yG_hint",
			"list": "L2K8yG_list",
			"note": "L2K8yG_note",
			"option": "L2K8yG_option",
			"optionActive": "L2K8yG_optionActive",
			"optionItem": "L2K8yG_optionItem",
			"optionName": "L2K8yG_optionName",
			"optionNameEn": "L2K8yG_optionNameEn",
			"popover": "L2K8yG_popover",
			"previewAuthor": "L2K8yG_previewAuthor",
			"previewDefault": "L2K8yG_previewDefault",
			"previewDefaultGlyph": "L2K8yG_previewDefaultGlyph",
			"previewFallback": "L2K8yG_previewFallback",
			"previewImage": "L2K8yG_previewImage",
			"previewMeta": "L2K8yG_previewMeta",
			"previewMonogram": "L2K8yG_previewMonogram",
			"previewName": "L2K8yG_previewName",
			"previewNoImage": "L2K8yG_previewNoImage",
			"previewPanel": "L2K8yG_previewPanel",
			"previewTagline": "L2K8yG_previewTagline",
			"retry": "L2K8yG_retry",
			"root": "L2K8yG_root",
			"trigger": "L2K8yG_trigger",
			"triggerLabel": "L2K8yG_triggerLabel"
		};
		//#endregion
		//#region src/client/SkinsSection.tsx
		/**
		* Skins settings section: a dropdown of every installed skin (catalog from
		* the host route) plus the default-theme entry. Hovering an option shows its
		* preview in a side panel; choosing one persists the selection and reloads
		* the page once the server has applied it. The host already waited for the
		* loader recomposition before answering, so the reload cannot race the patch
		* watcher.
		* @module @dsh-external/dsh-client-ui-skin-switcher/client/SkinsSection
		*/
		/**
		* The Skins settings page.
		* @param props - the injected translator (spread by the slot outlet).
		* @returns the section's React tree.
		*/
		function SkinsSection(props) {
			const t = props.t ?? ((key) => key);
			const [load, setLoad] = (0, react.useState)({ kind: "loading" });
			const [status, setStatus] = (0, react.useState)({ kind: "idle" });
			const [open, setOpen] = (0, react.useState)(false);
			const [hovered, setHovered] = (0, react.useState)(void 0);
			const [dark, setDark] = (0, react.useState)(() => document.body.hasAttribute("data-ds-dark-theme"));
			const loadCatalog = (0, react.useCallback)(async () => {
				setLoad({ kind: "loading" });
				try {
					const response = await fetch("/skin-switcher/catalog", { headers: { accept: "application/json" } });
					if (!response.ok) throw new Error(`catalog ${String(response.status)}`);
					const data = await response.json();
					setLoad({
						kind: "ready",
						skins: Array.isArray(data.skins) ? data.skins : []
					});
				} catch {
					setLoad({ kind: "failed" });
				}
			}, []);
			(0, react.useEffect)(() => {
				loadCatalog();
			}, [loadCatalog]);
			(0, react.useEffect)(() => {
				if (!open) return;
				const onDown = (event) => {
					const target = event.target;
					if (target === null) return;
					if (target.closest(`.${SkinsSection_module_css_default.popover}`) !== null || target.closest(`.${SkinsSection_module_css_default.trigger}`) !== null) return;
					setOpen(false);
				};
				const onKey = (event) => {
					if (event.key === "Escape") setOpen(false);
				};
				document.addEventListener("mousedown", onDown);
				document.addEventListener("keydown", onKey);
				return () => {
					document.removeEventListener("mousedown", onDown);
					document.removeEventListener("keydown", onKey);
				};
			}, [open]);
			const select = (0, react.useCallback)(async (key) => {
				if (status.kind === "busy") return;
				setStatus({ kind: "busy" });
				setOpen(false);
				setHovered(void 0);
				try {
					const response = await fetch("/skin-switcher/select", {
						method: "POST",
						headers: { "content-type": "application/json" },
						body: JSON.stringify({ skinId: key })
					});
					if (!response.ok) throw new Error(`select ${String(response.status)}`);
					setStatus({ kind: "done" });
					window.setTimeout(() => window.location.reload(), 500);
				} catch {
					setStatus({
						kind: "error",
						message: t("applyError")
					});
				}
			}, [status.kind, t]);
			if (load.kind === "loading") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
				className: SkinsSection_module_css_default.note,
				children: t("applying")
			});
			if (load.kind === "failed") return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: SkinsSection_module_css_default.note,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("loadError") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: SkinsSection_module_css_default.retry,
					onClick: () => void loadCatalog(),
					children: t("retry")
				})]
			});
			const skins = load.skins;
			const activeKey = skins.find((skin) => skin.enabled)?.rowId ?? null;
			const activeName = activeKey === null ? t("default") : skins.find((skin) => skin.rowId === activeKey)?.name ?? t("default");
			const previewKey = open ? hovered ?? activeKey : activeKey;
			const previewSkin = previewKey === null ? void 0 : skins.find((skin) => skin.rowId === previewKey);
			const busy = status.kind === "busy";
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: SkinsSection_module_css_default.root,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: SkinsSection_module_css_default.hint,
						children: t("hint")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: SkinsSection_module_css_default.combo,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: SkinsSection_module_css_default.trigger,
							onClick: () => setOpen((value) => !value),
							"aria-haspopup": "listbox",
							"aria-expanded": open,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: SkinsSection_module_css_default.triggerLabel,
								children: activeName
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: SkinsSection_module_css_default.caret,
								"aria-hidden": "true",
								children: "▾"
							})]
						}), open && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: SkinsSection_module_css_default.popover,
							role: "listbox",
							"aria-label": t("title"),
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("ul", {
								className: SkinsSection_module_css_default.list,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(OptionRow, {
									active: activeKey === null,
									name: t("default"),
									accent: void 0,
									onHover: () => setHovered(null),
									onClick: () => void select(null),
									busy
								}), skins.map((skin) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(OptionRow, {
									active: skin.enabled,
									name: skin.name,
									nameEn: skin.nameEn,
									accent: skin.accent,
									onHover: () => setHovered(skin.rowId),
									onClick: () => void select(skin.rowId),
									busy
								}, skin.rowId))]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: SkinsSection_module_css_default.previewPanel,
								"aria-hidden": "true",
								children: previewSkin === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: SkinsSection_module_css_default.previewDefault,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: SkinsSection_module_css_default.previewDefaultGlyph,
										children: "✦"
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("default") })]
								}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [previewSkin.previewUrl?.[dark ? "dark" : "light"] !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
									src: previewSkin.previewUrl[dark ? "dark" : "light"],
									alt: "",
									className: SkinsSection_module_css_default.previewImage
								}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(NoPreviewFallback, {
									name: previewSkin.name,
									accent: previewSkin.accent,
									t
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: SkinsSection_module_css_default.previewMeta,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: SkinsSection_module_css_default.previewName,
											children: previewSkin.name
										}),
										previewSkin.tagline !== void 0 && previewSkin.tagline !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: SkinsSection_module_css_default.previewTagline,
											children: previewSkin.tagline
										}),
										previewSkin.author !== void 0 && previewSkin.author !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: SkinsSection_module_css_default.previewAuthor,
											children: previewSkin.author
										})
									]
								})] })
							})]
						})]
					}),
					status.kind === "busy" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: SkinsSection_module_css_default.note,
						children: t("applying")
					}),
					status.kind === "done" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: SkinsSection_module_css_default.note,
						children: t("refreshed")
					}),
					status.kind === "error" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: SkinsSection_module_css_default.note,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: status.message }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: SkinsSection_module_css_default.retry,
							onClick: () => window.location.reload(),
							children: t("refresh")
						})]
					})
				]
			});
		}
		/** Accent-tinted placeholder shown when a skin ships no preview image. */
		function NoPreviewFallback({ name, accent, t }) {
			const tinted = accent !== void 0 && /^#[0-9a-f]{6}$/i.test(accent) ? `${accent}22` : void 0;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: SkinsSection_module_css_default.previewFallback,
				style: tinted !== void 0 ? { background: tinted } : void 0,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: SkinsSection_module_css_default.previewMonogram,
					children: name.trim().slice(0, 1) || "✦"
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: SkinsSection_module_css_default.previewNoImage,
					children: t("noPreview")
				})]
			});
		}
		function OptionRow({ active, name, nameEn, accent, onHover, onClick, busy }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", {
				className: SkinsSection_module_css_default.optionItem,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: `${SkinsSection_module_css_default.option}${active ? ` ${SkinsSection_module_css_default.optionActive}` : ""}`,
					role: "option",
					"aria-selected": active,
					onMouseEnter: onHover,
					onClick,
					disabled: busy,
					children: [
						accent !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: SkinsSection_module_css_default.accent,
							style: { background: accent },
							"aria-hidden": "true"
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: SkinsSection_module_css_default.optionName,
							children: name
						}),
						nameEn !== void 0 && nameEn !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: SkinsSection_module_css_default.optionNameEn,
							children: nameEn
						}),
						active && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: SkinsSection_module_css_default.activeTick,
							"aria-hidden": "true",
							children: "✓"
						})
					]
				})
			});
		}
		//#endregion
		//#region src/client/locales.ts
		/**
		* `settings.skin-switcher` namespace dictionaries (the skin-switcher page
		* copy). The namespace is plugin-specific so it cannot collide with another
		* skin manager's locale registration. Product copy is Chinese; English is the
		* secondary locale.
		* @module @dsh-external/dsh-client-ui-skin-switcher/client/locales
		*/
		const NS = "settings.skin-switcher";
		const zh = {
			nav: "皮肤",
			title: "皮肤",
			hint: "下拉选择一款皮肤，悬停可预览效果；选择后页面自动刷新并应用。「默认主题」回到 DeepSeek Harness 原生界面。",
			default: "默认主题",
			defaultDesc: "关闭所有皮肤，使用原生界面",
			active: "使用中",
			applying: "正在应用…",
			refreshed: "已切换，正在刷新…",
			loadError: "皮肤列表加载失败",
			applyError: "切换失败，请重试",
			empty: "还没有安装任何皮肤",
			emptyHint: "皮肤以 dsh bundle 形式安装（如 dsh plugin --profile web add <皮肤目录>），重启 dsh 后即可在此选择。",
			retry: "重试",
			refresh: "刷新页面",
			author: "作者",
			noPreview: "无预览"
		};
		const en = {
			nav: "Skins",
			title: "Skins",
			hint: "Pick a skin from the dropdown; hover an option to preview it. The page refreshes and applies the choice. Choose 「默认主题」 to return to the native DeepSeek Harness look.",
			default: "Default theme",
			defaultDesc: "Disable every skin and use the native UI",
			active: "Active",
			applying: "Applying…",
			refreshed: "Switched — refreshing…",
			loadError: "Failed to load the skin list",
			applyError: "Switch failed, please retry",
			empty: "No skins installed yet",
			emptyHint: "Skins install as dsh bundles (e.g. dsh plugin --profile web add <skin-dir>); restart dsh, then pick one here.",
			retry: "Retry",
			refresh: "Refresh",
			author: "Author",
			noPreview: "No preview"
		};
		//#endregion
		//#region src/client/index.ts
		/**
		* Skin switcher plugin, browser half. Registers the 皮肤 (Skins) settings
		* section once the shell declares `settings.section`. The section fetches the
		* catalog from the host route, lets the user pick a skin, and reloads the
		* page after the selection is applied. Export discipline: only what the cordis
		* Loader needs (name/inject/apply) plus the section's public types.
		* @module @dsh-external/dsh-client-ui-skin-switcher/client
		*/
		/** Stable Cordis plugin name (matches the bundle patch row id). */
		const name = "ui-skin-switcher";
		/** Required services (cordis fiber inject): slots for the settings section, locale for copy. */
		const inject = ["slots", "locale"];
		/**
		* Register the Skins section once the `settings.section` declaration is on
		* the ledger, and keep its copy registered for the plugin lifetime. The
		* section id and locale namespace use the `skin-switcher` name (not the
		* generic `skins`) so this plugin cannot collide with another skin manager
		* that claims the same slot id.
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "skin-switcher: copy dictionaries");
			const t = ctx.locale.bind(NS);
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "skin-switcher",
				order: 20,
				label: () => t("nav"),
				inject: () => ({ t })
			}, SkinsSection));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		exports.name = name;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map