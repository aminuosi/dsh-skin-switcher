# dsh-skin-switcher · 皮肤切换插件

**中文** · [English](README.en.md)

> 为 DeepSeek Harness（dsh）Web GUI 提供**设置内的皮肤切换器**：自动发现所有已安装皮肤，下拉选择，**悬停即预览**，点击后刷新页面生效。

纯 Cordis 插件，不修改 dsh 源码；与 [dsh-deep-whale](https://github.com/Small-tailqwq/dsh-deep-whale) 等 `skin.json` 生态皮肤开箱即用。

## 功能亮点

- **设置 → 皮肤**：独立设置页，侧栏「皮肤」入口（section id `skin-switcher`，避免与其他皮肤管理器撞车）。
- **下拉选择 + 悬停预览**：选项悬停时右侧即时显示皮肤预览小图（跟随当前明/暗主题自动选对应预览），并展示名称、标语、作者、主题色。
- **自动发现**：扫描 loader 条目，凡携带 `skin.json`（或 `exports["./skin.json"]`）的包都视为皮肤；新装的皮肤重启后自动出现，无需注册。
- **互斥切换**：任一时刻只有一款皮肤生效；「默认主题」一键回到原生界面。
- **干净激活**：切换写入 loader 行的 disabled 状态，下一次页面刷新只加载被选皮肤的客户端 bundle——不是"全装全加载、只切视觉"。
- **补丁外科手术式写入**：只重写 `cordis.patch.yml` 中被标记注释夹住的管理块，手写条目与注释原样保留；dsh 的用户补丁层热更新（`watchUserPatches`）在数秒内重合成，无需重启服务。

## 安装

```sh
cd <harness>
dsh plugin --profile web add ../dsh-skin-switcher        # 本地目录
# 或
dsh plugin --profile web add github:<你的用户名>/dsh-skin-switcher   # GitHub
```

重启 `dsh --profile web`，打开 **设置 → 皮肤**：下拉框列出「默认主题」与全部已安装皮肤，悬停预览、点击切换、页面自动刷新生效。

卸载：

```sh
dsh plugin --profile web remove @dsh-external/dsh-client-ui-skin-switcher
```

## 皮肤包协议

任何 dsh bundle 满足以下条件即被识别为皮肤，并出现在下拉框中：

- 包内携带 `skin.json`（或 `package.json` 的 `exports["./skin.json"]` 指向它），字段：

| 字段 | 说明 |
|---|---|
| `id` | 皮肤身份（必填） |
| `name` / `nameEn` | 显示名称（中/英） |
| `author` / `tagline` / `description` | 作者、标语、描述 |
| `accent` | 主题色（下拉框圆点） |
| `preview.light` / `preview.dark` | 预览图相对路径（webp/png/jpg/gif/avif/svg 等均支持） |
| `order` | 列表排序 |

- 以 dsh bundle 形式安装（`cordis.patch.yml` 插入自己的皮肤行，`dsh.bundle.patch` 声明）。

参考实现：[maid-atelier](https://github.com/Small-tailqwq/dsh-deep-whale)、[dsh-client-ui-skin-claude](https://github.com/PAKIKNOWLEDGE/dsh-client-ui-skin-claude)。

## 工作原理

1. **发现**：宿主半边遍历 loader 条目，按包名解析出携带 `skin.json` 的包，组装目录（含实时启用状态与预览图 URL）。
2. **选择**：`POST /skin-switcher/select` 把选中皮肤行置为启用、其余皮肤行置为禁用，写入 `~/.dsh/profiles/<name>/cordis.patch.yml` 的管理块。
3. **生效**：dsh 的用户补丁层热更新重新合成 loader 树 → `client-modules` 重算 `window.__DSH_BOOT__` → 浏览器刷新后只加载被选皮肤的 bundle，其客户端 `apply()` 自动装饰界面。

## 路由

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/skin-switcher/catalog` | 已安装皮肤列表（名称/作者/主题色/预览 URL/启用状态） |
| POST | `/skin-switcher/select` | body `{ "skinId": <行 id 或 null> }`；`null` = 默认主题。写入补丁并等待重合成 |
| GET | `/skin-switcher/preview?pkg=<包名>&mode=light\|dark` | 预览图（按扩展名返回正确 content-type，防目录穿越） |

## 开发

```sh
pnpm install
pnpm test       # vitest：补丁写入、皮肤发现、预览 MIME（23 个用例）
pnpm typecheck
pnpm build      # tsdown → lib/index.js（宿主）+ lib/client.js（浏览器端）
```

`lib/` 为提交的构建产物：用户 `dsh plugin add` 克隆后无需构建即可安装。

## 许可

MIT
