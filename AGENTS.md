# Earth Online 服务端开发注意事项

## 原则

- 根目录的 assets 目录给 README.md 使用，用于给看仓库的人提供图片演示，不要和 web 网站的 assets 混淆。
- 和汇率相关代码及文件不要碰，这是 apk 的接口，不是 server 的 web 服务，所以在改 web 的时候不要误改 apk 接口。

## 技术栈（AI-first 对齐，升级时同步本节）

| 项 | 版本 | 说明 |
|---|---|---|
| Astro | 7.3.3 | 站点框架（静态输出，内容站为主） |
| @astrojs/react | 6.0.6 | React 岛屿集成 |
| React / react-dom | 19.3.0 | 交互组件（工具页、文章内嵌组件） |
| @astrojs/mdx | 8.0.1 | 博客文章格式 |
| Node | 24 | CI 与本地 |
| 样式 | — | tokens.css 设计令牌 + 原生 CSS，**不用 Tailwind** |

关键约定：

- **base 路径**：部署在 gh-pages 子路径 `/earth-online-metadata/`，页面内所有链接必须经 `src/lib/paths.js` 的 `withBase()` 生成，禁止硬编码 `/tools/` 这类根路径。
- **路由**：`/` 手写 meta 跳转到 `/tools/`（Astro redirects 不带 base，勿改回）；`/tools/` 工具页、`/articles/` 博客、`/privacy/`、`/terms/`；`trailingSlash: 'always'`。
- **主题**：亮/暗/跟随系统三态循环，偏好存 `localStorage('eo_theme')`；首屏防闪脚本在 `Base.astro` head 内联，切换逻辑在 `AppNav.astro`。
- **组件样式作用域**：`.astro` 页面用 scoped `<style>`；React 岛屿的样式用宿主页 `<style is:global>`（scoped 选择器打不进岛屿 DOM）。

## 内容创作

- **发文章**：在 `src/content/articles/` 加一个 `.mdx`（frontmatter：title/description/date/tags），列表页与详情页自动生成；内嵌多媒体组件从 `src/components/articles/` import（如 `DataPanel`）。
- **上工具**：实现 React 组件 + `src/pages/tools/<slug>.astro` 页面，然后在 `src/tools/registry.js` 注册一条，搜索与卡片自动生效。

## 发布

- **server 仓库发布**：在本仓库根执行 **`tools\dev release`**（零依赖 Dart 脚本 `tools/dev/main.dart`，经 `tools\dev.cmd` 垫片直接 dart 执行，**不打包 exe**）。流程：dev→main 合并 → github 完整同步 → gitee 展示分支（README+assets）同步。
- 演练加 `--dry-run`（或 `-n`）：`tools\dev release --dry-run`，只打印 git 命令不实际执行。
- 改动在 **dev** 分支开发，上线用 `tools\dev release`，**不要手动操作分支或 gitee**。
- **改版期间**（见 `docs/升级计划.md` 验收状态）只在 dev 开发，不执行发布。
- **app 发布**用 app 仓库的 `eo release`（不触碰 server 仓库）。

## 汇率数据

欧洲央行（ECB）汇率，EUR 基准，由 GitHub Actions 每日 23:30 定时更新。
数据位于 `ledger/v1/exchange_rates.json`，仅供 APK 调用，勿改动。

## 仓库结构

```
├── .github/workflows/
│   ├── update_rates.yml   # 汇率定时更新（APK 接口）
│   └── deploy.yml         # 官网构建部署到 gh-pages（push main 触发）
├── astro.config.mjs       # Astro 配置（site/base/trailingSlash/集成）
├── package.json           # 依赖见「技术栈」节
├── tsconfig.json          # extends astro/tsconfigs/base
├── docs/升级计划.md        # 改版计划与验收标准（工具页对标 it-tools，博客对标 distill.pub）
├── ledger/v1/exchange_rates.json  # 汇率数据（APK 接口）
├── update_ledger_rates.js         # 汇率抓取脚本
├── src/
│   ├── content.config.ts  # 文章集合 schema（title/description/date/tags）
│   ├── content/articles/  # 博客文章：每篇一个 .mdx
│   ├── layouts/Base.astro # 全站外壳（导航 + 页脚 + 主题防闪内联脚本）
│   ├── components/
│   │   ├── AppNav.astro   # 顶部导航（含主题循环切换）
│   │   ├── Footer.astro   # 页脚
│   │   ├── tools/ToolGrid.jsx     # 工具网格（搜索 + 卡片，React 岛屿）
│   │   └── articles/DataPanel.jsx # 文章数据面板（图表占位）
│   ├── tools/registry.js  # 工具注册表（新增工具 = 加一条）
│   ├── lib/paths.js       # withBase：gh-pages 子路径链接前缀
│   ├── styles/tokens.css  # M3 设计令牌 + 全局外壳样式（fnos 风格根基）
│   └── pages/
│       ├── index.astro            # 主页 = meta 跳转到 /tools/
│       ├── tools/index.astro      # 工具页（React 岛屿挂载）
│       ├── articles/index.astro   # 文章列表
│       ├── articles/[...slug].astro # 文章详情（MDX 渲染 + 排版）
│       ├── privacy.astro / terms.astro
├── public/                # 静态资源（随构建进 dist）
├── tools/
│   ├── dev.cmd            # 发布垫片：tools\dev release
│   └── dev/main.dart      # 发布脚本（零依赖 Dart，直接执行，无 exe）
├── assets/                # README 演示图（勿与 web 混淆）
└── README.md
```
