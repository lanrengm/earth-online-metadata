# Earth Online 服务端开发注意事项

## 开发模式：AI-first + 文档驱动 + 自动化验证

**三支柱缺一不可**：

1. **AI-first**：全部代码由 AI 编写，用户只做验收；扩展点一律做成「填空式」（发文章 = 加 .mdx，上工具 = 注册表加一条），降低 AI 理解成本。
2. **文档驱动**：动手前先读本文件与 `docs/架构决策.md`；**改架构必先改文档**，文档与代码同步更新，防止多会话漂移。
3. **自动化验证**：每次改动完成必须跑 **`npm run verify`**（lint + check + build + test）全绿才算完成；CI 在 dev 上跑同样流水线守门（`.github/workflows/ci.yml`）。

验证分层：

| 层 | 命令 | 拦什么 |
|---|---|---|
| 代码分析 | `npm run lint`（ESLint：astro + react-hooks + ts） | hooks 误用、未用变量、可疑模式 |
| 类型检查 | `npm run check`（astro check） | .astro/.ts/.jsx 类型错误 |
| 构建 | `npm run build` | 路由/MDX/frontmatter schema（zod）错误 |
| 测试 | `npm run test`（Vitest，`tests/`） | 管线守卫（注册表/文章 frontmatter）+ dist 冒烟（关键路由、base 前缀跳转） |

新会话工作流：读文档 → 改代码 → `npm run verify` 全绿 → 同步更新相关文档 → 提交。

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
| ESLint | 9（flat config） | 代码分析：astro + typescript-eslint + react-hooks 插件 |
| Vitest | 4 | 自动化测试：单元 + 管线守卫 + dist 冒烟（tests/） |
| ECharts | 6.1.0 | 文章图表（唯一封装入口 `src/components/articles/Chart.jsx`，按需注册；决策见 docs/架构决策.md #11） |

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
│   ├── deploy.yml         # 官网构建部署到 gh-pages（push main 触发）
│   └── ci.yml             # dev 守门：lint + check + build + test（自动化验证流水线）
├── astro.config.mjs       # Astro 配置（site/base/trailingSlash/集成）
├── eslint.config.js       # ESLint flat config（astro/ts/react-hooks）
├── package.json           # 依赖见「技术栈」节；scripts: dev/build/preview/check/lint/test/verify
├── tsconfig.json          # extends astro/tsconfigs/base
├── tests/                 # Vitest：paths/registry/content 单测 + smoke.dist 冒烟（需先 build）
├── docs/
│   ├── 升级计划.md         # 改版计划与验收标准（工具页对标 it-tools，博客对标 distill.pub）
│   └── 架构决策.md         # 架构决策记录（防漂移；改架构必先改此文档）
├── ledger/v1/exchange_rates.json  # 汇率数据（APK 接口）
├── update_ledger_rates.js         # 汇率抓取脚本
├── src/
│   ├── content.config.ts  # 文章集合 schema（title/description/date/tags）
│   ├── content/articles/  # 博客文章：每篇一个 .mdx
│   ├── layouts/Base.astro # 全站外壳（导航 + 页脚 + 主题防闪内联脚本）
│   ├── components/
│   │   ├── AppNav.astro   # 顶部导航（含主题循环切换）
│   │   ├── Footer.astro   # 页脚
│   │   ├── tools/
│   │   │   ├── ToolGrid.jsx         # 工具网格（搜索 + 卡片，React 岛屿）
│   │   │   └── LifeQuestTree.jsx    # 人生主线任务板（首个工具）
│   │   └── articles/
│   │       ├── Chart.jsx            # ECharts 通用封装（全站唯一入口）
│   │       ├── DataPanel.jsx        # 文章数据面板
│   │       ├── EducationChart.jsx   # 学历排位交互图（七普数据）
│   │       ├── EducationTrend.jsx   # 高等教育毛入学率趋势（2012-2024）
│   │       └── ProjectionChart.jsx  # 2030 排位推算（年份滑块）
│   ├── data/
│   │   ├── census2020SingleAge.json # 七普表4-1单岁基线（模型输入）
│   │   ├── educationProjection.json # 队列外推模型输出（2020-2030）
│   │   ├── census2020.js            # 七普校准数据（含来源与口径注释）
│   │   └── eduTrends.js             # 教育部毛入学率年度序列
│   ├── tools/registry.js  # 工具注册表（新增工具 = 加一条）
│   ├── tools/lifeQuestData.js # 人生主线任务树数据（任务 id 稳定，勿改）
│   ├── lib/paths.js       # withBase：gh-pages 子路径链接前缀
│   ├── styles/tokens.css  # M3 设计令牌 + 全局外壳样式（fnos 风格根基）
│   └── pages/
│       ├── index.astro            # 主页 = meta 跳转到 /tools/
│       ├── tools/index.astro      # 工具页（React 岛屿挂载）
│       ├── tools/life-quest.astro # 人生主线（首个工具，任务板交互）
│       ├── articles/index.astro   # 文章列表
│       ├── articles/[...slug].astro # 文章详情（MDX 渲染 + 排版）
│       ├── privacy.astro / terms.astro
├── public/                # 静态资源（随构建进 dist；data/census2020/ 存官方数据原文件）
├── scripts/
│   └── build-education-projection.mjs # 队列外推模型（生成 educationProjection.json，可复现）
├── tools/
│   ├── dev.cmd            # 发布垫片：tools\dev release
│   └── dev/main.dart      # 发布脚本（零依赖 Dart，直接执行，无 exe）
├── assets/                # README 演示图（勿与 web 混淆）
└── README.md
```
