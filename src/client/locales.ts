/**
 * `settings.skin-switcher` namespace dictionaries (the skin-switcher page
 * copy). The namespace is plugin-specific so it cannot collide with another
 * skin manager's locale registration. Product copy is Chinese; English is the
 * secondary locale.
 * @module @dsh-external/dsh-client-ui-skin-switcher/client/locales
 */

export const NS = 'settings.skin-switcher'

export const zh = {
  nav: '皮肤',
  title: '皮肤',
  hint: '下拉选择一款皮肤，悬停可预览效果；选择后页面自动刷新并应用。「默认主题」回到 DeepSeek Harness 原生界面。',
  default: '默认主题',
  defaultDesc: '关闭所有皮肤，使用原生界面',
  active: '使用中',
  applying: '正在应用…',
  refreshed: '已切换，正在刷新…',
  loadError: '皮肤列表加载失败',
  applyError: '切换失败，请重试',
  empty: '还没有安装任何皮肤',
  emptyHint: '皮肤以 dsh bundle 形式安装（如 dsh plugin --profile web add <皮肤目录>），重启 dsh 后即可在此选择。',
  retry: '重试',
  refresh: '刷新页面',
  author: '作者',
  noPreview: '无预览',
} as const

export const en = {
  nav: 'Skins',
  title: 'Skins',
  hint: 'Pick a skin from the dropdown; hover an option to preview it. The page refreshes and applies the choice. Choose 「默认主题」 to return to the native DeepSeek Harness look.',
  default: 'Default theme',
  defaultDesc: 'Disable every skin and use the native UI',
  active: 'Active',
  applying: 'Applying…',
  refreshed: 'Switched — refreshing…',
  loadError: 'Failed to load the skin list',
  applyError: 'Switch failed, please retry',
  empty: 'No skins installed yet',
  emptyHint: 'Skins install as dsh bundles (e.g. dsh plugin --profile web add <skin-dir>); restart dsh, then pick one here.',
  retry: 'Retry',
  refresh: 'Refresh',
  author: 'Author',
  noPreview: 'No preview',
} as const

export type SkinSwitchKey = keyof typeof zh
